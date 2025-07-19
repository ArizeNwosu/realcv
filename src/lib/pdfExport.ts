import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { ResumeSection } from './resumeTemplate'
import { WritingSession } from './tracking'
import { DocumentCodeManager } from './documentCodes'

interface ExportData {
  sections: ResumeSection[]
  session: WritingSession
  title: string
  resumeId: string
}

export class PDFExporter {
  static async generateDocumentCode(): Promise<string> {
    // Generate a unique 4-4-4 format code like AB19-F8C3-92XZ
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const generateSegment = (length: number) => {
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    }
    
    return `${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`
  }

  static async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      return ''
    }
  }

  static getTrustTier(session: WritingSession) {
    const typingMinutes = Math.round(session.totalTypingTime / 60000)
    const largePastes = session.pasteEvents.filter(p => p.textLength > 100).length
    
    if (typingMinutes >= 15 && session.editCount >= 3 && largePastes === 0) {
      return { tier: 3, label: "Tier 3: High Trust - Verified Human" }
    } else if (typingMinutes >= 5 && session.editCount >= 2) {
      return { tier: 2, label: "Tier 2: Medium Trust - Process-Based Proof" }
    } else {
      return { tier: 1, label: "Tier 1: Basic Trust - Limited Evidence" }
    }
  }

  static stripHtml(html: string): string {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  static renderFormattedText(html: string, pdf: any, x: number, startY: number, maxWidth: number): number {
    let currentY = startY
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Get all text content with proper line breaks
    const getText = (element: Element): string[] => {
      const lines: string[] = []
      
      const processElement = (el: Element | Node): void => {
        if (el.nodeType === Node.TEXT_NODE) {
          const text = el.textContent?.trim()
          if (text) {
            lines.push(text)
          }
        } else if (el.nodeType === Node.ELEMENT_NODE) {
          const element = el as Element
          const tagName = element.tagName?.toLowerCase()
          
          switch (tagName) {
            case 'br':
              lines.push('')
              break
              
            case 'p':
              // Process paragraph content - no extra line breaks
              const pText = element.textContent?.trim()
              if (pText) {
                lines.push(pText)
              }
              break
              
            case 'div':
              // For divs, process children but don't add extra line breaks
              Array.from(element.childNodes).forEach(child => {
                processElement(child)
              })
              break
              
            case 'ul':
            case 'ol':
              const listItems = element.querySelectorAll('li')
              listItems.forEach((li, index) => {
                const bullet = tagName === 'ul' ? '• ' : `${index + 1}. `
                const text = li.textContent?.trim()
                if (text) {
                  lines.push(bullet + text)
                }
              })
              break
              
            case 'strong':
            case 'b':
            case 'em':
            case 'i':
              // For formatting tags, just get the text content
              const formattedText = element.textContent?.trim()
              if (formattedText) {
                lines.push(formattedText)
              }
              break
              
            default:
              // Process children for other elements
              Array.from(element.childNodes).forEach(child => {
                processElement(child)
              })
              break
          }
        }
      }
      
      Array.from(element.childNodes).forEach(child => {
        processElement(child)
      })
      
      return lines
    }
    
    // If no HTML tags, just split by line breaks
    if (!html.includes('<')) {
      const lines = html.split('\n').filter(line => line.trim())
      for (const line of lines) {
        const wrappedLines = pdf.splitTextToSize(line.trim(), maxWidth)
        for (const wrappedLine of wrappedLines) {
          pdf.text(wrappedLine, x, currentY)
          currentY += 5
        }
      }
      return currentY
    }
    
    // Process HTML content
    const lines = getText(tempDiv)
    
    // Filter out consecutive empty lines and excessive whitespace
    const filteredLines = lines.filter((line, index) => {
      // Keep non-empty lines
      if (line.trim() !== '') return true
      
      // For empty lines, only keep if the previous line was not empty
      if (index === 0) return false
      return lines[index - 1].trim() !== ''
    })

    for (const line of filteredLines) {
      if (line.trim() === '') {
        // Empty line for spacing - reduced spacing
        currentY += 3
      } else {
        // Wrap long lines
        const wrappedLines = pdf.splitTextToSize(line, maxWidth)
        for (const wrappedLine of wrappedLines) {
          pdf.text(wrappedLine, x, currentY)
          currentY += 5
        }
      }
    }
    
    return currentY
  }

  static async exportToPDF(data: ExportData): Promise<void> {
    const { sections, session, title, resumeId } = data
    
    // Generate document code and verification URL
    const documentCode = DocumentCodeManager.createDocumentCode(resumeId)
    const verificationUrl = `${window.location.origin}/verify/${documentCode}`
    const qrCodeDataUrl = await this.generateQRCode(verificationUrl)
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    
    let yPosition = margin

    // Title - centered and prominent
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    const titleWidth = pdf.getTextWidth(title)
    pdf.text(title, (pageWidth - titleWidth) / 2, yPosition)
    yPosition += 12

    // Process each section
    for (const section of sections) {
      if (!section.content.trim()) continue
      
      // Special formatting for header section
      if (section.id === 'header') {
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
        const content = this.stripHtml(section.content)
        const lines = pdf.splitTextToSize(content, contentWidth)
        
        lines.forEach((line: string) => {
          const lineWidth = pdf.getTextWidth(line)
          pdf.text(line, (pageWidth - lineWidth) / 2, yPosition)
          yPosition += 5
        })
        yPosition += 15
        continue
      }
      
      // Section title - Harvard style with underline
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      const sectionTitle = section.title.toUpperCase()
      pdf.text(sectionTitle, margin, yPosition)
      
      // Add underline
      const titleWidth = pdf.getTextWidth(sectionTitle)
      pdf.line(margin, yPosition + 1, margin + titleWidth, yPosition + 1)
      yPosition += 4 // Reduced spacing after section title
      
      // Section content with formatting
      pdf.setFontSize(10)
      
      // Check if we need a new page first
      const estimatedHeight = 50 // Rough estimate
      if (yPosition + estimatedHeight > pageHeight - 40) {
        pdf.addPage()
        yPosition = margin
      }
      
      // Render formatted content directly
      yPosition = this.renderFormattedText(section.content, pdf, margin, yPosition, contentWidth)
      yPosition += 3 // Reduced spacing after section content
      
      // Add line divider between sections (except for the last section)
      const isLastSection = sections.indexOf(section) === sections.length - 1
      if (!isLastSection) {
        pdf.setDrawColor(200, 200, 200) // Light gray color
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 15 // Add spacing after line
      }
    }

    // Add certificate page
    pdf.addPage()
    yPosition = margin

    // Certificate header
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Human-Verified Resume Certificate', margin, yPosition)
    yPosition += 20

    // Document code
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Document Code: ${documentCode}`, margin, yPosition)
    yPosition += 15

    // Trust tier
    const trustTier = this.getTrustTier(session)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Trust Level:', margin, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(trustTier.label, margin + 30, yPosition)
    yPosition += 15

    // Writing statistics
    const typingMinutes = Math.round(session.totalTypingTime / 60000)
    const stats = [
      `• Written in ${typingMinutes} minutes of active typing`,
      `• ${session.editCount} revisions made`,
      `• ${session.pasteEvents.length} paste events`,
      `• ${session.pasteEvents.filter(p => p.textLength > 100).length} large paste events (>100 chars)`,
      `• ${session.keystrokes} total keystrokes`
    ]

    pdf.setFontSize(11)
    stats.forEach(stat => {
      pdf.text(stat, margin, yPosition)
      yPosition += 6
    })
    yPosition += 10

    // QR Code
    if (qrCodeDataUrl) {
      pdf.text('Scan to verify online:', margin, yPosition)
      yPosition += 10
      pdf.addImage(qrCodeDataUrl, 'PNG', margin, yPosition, 30, 30)
      yPosition += 35
    }

    // Verification URL
    pdf.setFontSize(10)
    pdf.text(`Verify online: ${verificationUrl}`, margin, yPosition)
    yPosition += 10

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    pdf.text('Generated with RealCV — the trust layer for human-created resumes', margin, yPosition + 10)
    pdf.text(`Document ID: ${resumeId} | Generated: ${new Date().toLocaleDateString()}`, margin, yPosition + 15)

    // Save the PDF
    pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_verified.pdf`)
  }

  static createPrintableResume(sections: ResumeSection[]): string {
    let html = `
      <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    `
    
    sections.forEach(section => {
      if (!section.content.trim()) return
      
      html += `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1f2937;">
            ${section.title}
          </h2>
          <div style="font-size: 14px;">
            ${section.content}
          </div>
        </div>
      `
    })
    
    html += '</div>'
    return html
  }
}