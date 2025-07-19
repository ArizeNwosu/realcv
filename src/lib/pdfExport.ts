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
    
    // Simplified approach: get plain text and split by natural breaks
    const plainText = tempDiv.textContent || tempDiv.innerText || ''
    
    // Split into lines and filter out empty ones
    let lines = plainText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    // If we still have no content but HTML exists, try a different approach
    if (lines.length === 0 && html.trim().length > 0) {
      // Remove HTML tags and get text
      const cleanText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      if (cleanText.length > 0) {
        lines.push(cleanText)
      }
    }
    
    // Special handling for bullet points that are all on one line (like Activities section)
    if (lines.length === 1 && lines[0].includes('•')) {
      const line = lines[0]
      // Split on bullet points and clean up
      const bulletItems = line.split('•').map(item => item.trim()).filter(item => item.length > 0)
      if (bulletItems.length > 1) {
        // Convert back to separate bullet lines
        lines = bulletItems.map(item => `• ${item}`)
        
        if (html.includes('Presidential Medal')) {
          console.log('ACTIVITIES DEBUG - Converted to', lines.length, 'bullet lines:', lines)
        }
      }
    }

    // Render each line
    for (const line of lines) {
      const wrappedLines = pdf.splitTextToSize(line, maxWidth)
      
      // Debug logging for ACTIVITIES & LEADERSHIP section
      if (html.includes('Presidential Medal')) {
        console.log('ACTIVITIES DEBUG - Line:', line.substring(0, 50) + '...')
        console.log('ACTIVITIES DEBUG - Wrapped into', wrappedLines.length, 'lines')
        console.log('ACTIVITIES DEBUG - Y position before rendering:', currentY)
      }
      
      for (const wrappedLine of wrappedLines) {
        pdf.text(wrappedLine, x, currentY)
        currentY += 5
      }
      
      if (html.includes('Presidential Medal')) {
        console.log('ACTIVITIES DEBUG - Y position after rendering:', currentY)
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
      const yAfterTitle = yPosition + 8 // Proper spacing after section title for readability
      yPosition = yAfterTitle
      
      // Section content with formatting
      pdf.setFontSize(10)
      
      // Check if we need a new page first
      const estimatedHeight = 50 // Rough estimate
      if (yPosition + estimatedHeight > pageHeight - 40) {
        pdf.addPage()
        yPosition = margin
      }
      
      // Render formatted content directly
      const yBeforeRendering = yPosition
      yPosition = this.renderFormattedText(section.content, pdf, margin, yPosition, contentWidth)
      
      // Debug logging for ACTIVITIES & LEADERSHIP section
      if (section.title === 'Activities & Leadership') {
        console.log('ACTIVITIES DEBUG - Section Y before rendering:', yBeforeRendering)
        console.log('ACTIVITIES DEBUG - Section Y after rendering:', yPosition)
        console.log('ACTIVITIES DEBUG - Content took', yPosition - yBeforeRendering, 'units of space')
      }
      
      yPosition += 6 // Appropriate spacing after section content
      
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