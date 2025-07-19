import { useEffect, useRef, useState } from 'react'
import { ResumeTracker } from '../lib/tracking'
import { defaultResumeTemplate, ResumeSection as ResumeSectionType } from '../lib/resumeTemplate'
import { ResumeStorage } from '../lib/storage'
import { PDFExporter } from '../lib/pdfExport'
import { SubscriptionManager } from '../lib/subscription'
import { supabase } from '../lib/supabase'
import ResumeSection from '../components/ResumeSection'
import ResumePreview from '../components/ResumePreview'
import styles from '../styles/editor.module.css'
import Layout from '../components/Layout'
import { Geist, Geist_Mono } from 'next/font/google'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { useRouter } from 'next/router'
import { DocumentCodeManager } from '../lib/documentCodes'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ResumeEditor() {
  const router = useRouter();
  const { new: isNewResume } = router.query;
  const trackerRef = useRef<ResumeTracker>(new ResumeTracker(isNewResume === 'true'))
  const [sessionStats, setSessionStats] = useState(trackerRef.current.getSessionSummary())
  const [resumeSections, setResumeSections] = useState<ResumeSectionType[]>(defaultResumeTemplate)
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null)
  const [resumeTitle, setResumeTitle] = useState<string>('My Resume')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isActive: false,
    plan: 'free',
    status: 'inactive'
  })
  const [canExportPDF, setCanExportPDF] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pasteError, setPasteError] = useState('');

  const updateStats = () => {
    setSessionStats(trackerRef.current.getSessionSummary())
  }

  const checkCanExportPDF = async (updateState = false): Promise<boolean> => {
    console.log('🔍 checkCanExportPDF called with updateState:', updateState)
    
    // First check local subscription
    const localCanExport = SubscriptionManager.canExportPDF()
    console.log('📱 Local subscription check:', localCanExport)
    
    if (localCanExport) {
      if (updateState) setCanExportPDF(true)
      console.log('✅ Local subscription active, returning true')
      return true
    }

    // Then check Stripe subscription for authenticated users
    try {
      console.log('🔐 Checking Stripe subscription...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 User data:', user ? 'User found' : 'No user')
      
      if (user) {
        // Try to get customer ID from multiple sources
        let customerId = localStorage.getItem('stripe_customer_id') || user.user_metadata?.stripe_customer_id
        console.log('💳 Customer ID:', customerId)
        
        if (customerId) {
          console.log('🌐 Fetching billing history...')
          const response = await fetch(`/api/billing-history?customerId=${customerId}&limit=1`)
          const data = await response.json()
          console.log('📊 Billing API response:', response.ok, data)
          
          if (response.ok && data.current_subscription) {
            // User has active Stripe subscription
            if (updateState) setCanExportPDF(true)
            console.log('✅ Stripe subscription active, returning true')
            return true
          } else {
            console.log('❌ No active Stripe subscription found')
          }
        } else {
          console.log('❌ No customer ID found')
        }
      }
    } catch (error) {
      console.log('❌ Error checking Stripe subscription:', error)
    }

    if (updateState) setCanExportPDF(false)
    console.log('❌ No valid subscription found, returning false')
    return false
  }

  // Calculate total word count across all sections
  const calculateWordCount = (): number => {
    return resumeSections.reduce((total, section) => {
      if (!section.content.trim()) return total
      
      // Strip HTML tags and calculate words
      const tmp = document.createElement('div')
      tmp.innerHTML = section.content
      const plainText = tmp.textContent || tmp.innerText || ''
      
      // More robust word counting - handle all types of whitespace including line breaks
      const words = plainText
        .trim()
        .split(/\s+/) // Split on any whitespace (spaces, newlines, tabs, etc.)
        .filter(word => word.length > 0)
      
      return total + words.length
    }, 0)
  }

  const handleSectionUpdate = (id: string, content: string) => {
    setResumeSections(prev => {
      const updated = prev.map(section => 
        section.id === id ? { ...section, content } : section
      )
      
      // Calculate word count immediately and update tracker
      const newWordCount = updated.reduce((total, section) => {
        if (!section.content.trim()) return total
        
        // Strip HTML tags and calculate words
        const tmp = document.createElement('div')
        tmp.innerHTML = section.content
        const plainText = tmp.textContent || tmp.innerText || ''
        
        // More robust word counting - handle all types of whitespace including line breaks
        const words = plainText
          .trim()
          .split(/\s+/) // Split on any whitespace (spaces, newlines, tabs, etc.)
          .filter(word => word.length > 0)
        
        return total + words.length
      }, 0)
      
      // Update word count in tracker for persistence
      trackerRef.current.updateWordCount(newWordCount)
      
      return updated
    });
    
    // Don't record edit here - only when save is clicked
    updateStats();
  }

  const handleKeystroke = () => {
    trackerRef.current.recordKeystroke()
    updateStats()
  }

  const handlePaste = (textLength: number) => {
    if (textLength > 1000) {
      setPasteError('Pasting more than 1000 characters at once is not allowed.');
      setTimeout(() => setPasteError(''), 4000);
      return;
    }
    trackerRef.current.recordPaste(textLength)
    updateStats()
  }

  // Load existing resume on mount
  useEffect(() => {
    const initializeEditor = async () => {
      console.log('🚀 EDITOR LOADED - NEW VERSION WITH TXT/WORD FIX')
      setIsLoading(true)
      
      // Wait for router to be ready
      if (!router.isReady) {
        setTimeout(() => setIsLoading(false), 100)
        return
      }
      
      // Clean up old localStorage entries that are no longer used
      localStorage.removeItem('realcv_editCount')
      localStorage.removeItem('realcv_pasteStats')
      
      const isCreatingNew = isNewResume === 'true'
      console.log('🔍 Initialize - isNewResume:', isNewResume, 'isCreatingNew:', isCreatingNew)
      
      // Migrate old document codes to new 12-character format
      DocumentCodeManager.clearAllCodes() // Force clear all old codes
      console.log('Cleared all document codes - new exports will generate 12-character codes')
      
      // Load subscription status
      setSubscriptionStatus(SubscriptionManager.getSubscriptionStatus())
      
      // Only clear session if explicitly creating a new resume
      if (isCreatingNew) {
        console.log('✨ Starting new resume session')
        localStorage.removeItem('realcv_session')
        localStorage.removeItem('realcv_current')
        console.log('🧹 Cleared analytics and current resume for new resume')
        
        setCurrentResumeId(null)
        setResumeTitle('Your Name')
        setResumeSections(defaultResumeTemplate.map(section => ({ ...section, content: '' })))
        // Create fresh tracker with no saved data
        trackerRef.current = new ResumeTracker(true) // true = start fresh
        updateStats()
        
        // Clear the ?new=true parameter from URL to prevent refresh issues
        router.replace('/editor', undefined, { shallow: true })
      } else {
        // Load existing resume (normal page load/refresh)
        const existingId = ResumeStorage.getCurrentResumeId()
        if (existingId) {
          const existingResume = ResumeStorage.getResume(existingId)
          if (existingResume) {
            setCurrentResumeId(existingId)
            setResumeTitle(existingResume.title)
            setResumeSections(existingResume.sections)
            console.log('📄 Loaded existing resume:', existingId)
            
            // Load existing analytics session (don't start fresh)
            trackerRef.current = new ResumeTracker(false) // false = load existing
            updateStats()
          } else {
            console.log('⚠️ Resume ID found but no resume data, starting fresh')
            setCurrentResumeId(null)
            setResumeTitle('Your Name')
            setResumeSections(defaultResumeTemplate.map(section => ({ ...section, content: '' })))
            trackerRef.current = new ResumeTracker(false) // false = load existing
            updateStats()
          }
        } else {
          console.log('📝 No existing resume found, starting with template')
          setCurrentResumeId(null)
          setResumeTitle('Your Name')
          setResumeSections(defaultResumeTemplate.map(section => ({ ...section, content: '' })))
          trackerRef.current = new ResumeTracker(false) // false = load existing
          updateStats()
        }
      }
      
      // Simulate loading for smooth UX
      setTimeout(() => {
        setIsLoading(false)
      }, 800)
    }
    
    initializeEditor()
  }, [router.isReady, isNewResume])

  // Auto-save functionality
  useEffect(() => {
    if (currentResumeId) {
      const autoSaveTimer = setTimeout(() => {
        ResumeStorage.updateResume(currentResumeId, resumeSections, trackerRef.current.getSession())
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer)
    }
  }, [resumeSections, currentResumeId])

  // Update stats every 5 seconds
  useEffect(() => {
    const interval = setInterval(updateStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Initialize word count when resume loads
  useEffect(() => {
    if (!isLoading && resumeSections.length > 0) {
      const currentWordCount = calculateWordCount()
      trackerRef.current.updateWordCount(currentWordCount)
      updateStats()
    }
  }, [isLoading, resumeSections.length])


  // Convert HTML to formatted plain text
  const convertHtmlToText = (html: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
    const container = doc.querySelector('div')
    
    const processNode = (node: Node, indent = 0): string => {
      let result = ''
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        return text ? text : ''
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        
        switch (element.tagName.toLowerCase()) {
          case 'strong':
          case 'b':
            const boldText = element.textContent?.trim()
            return boldText ? boldText.toUpperCase() : ''
            
          case 'em':
          case 'i':
            const italicText = element.textContent?.trim()
            return italicText ? `*${italicText}*` : ''
            
          case 'u':
            const underlineText = element.textContent?.trim()
            return underlineText ? `_${underlineText}_` : ''
            
          case 'ul':
            for (const child of Array.from(element.children)) {
              if (child.tagName.toLowerCase() === 'li') {
                const listItemText = processNode(child, indent)
                if (listItemText.trim()) {
                  result += `${'  '.repeat(indent)}• ${listItemText}\n`
                }
              }
            }
            return result
            
          case 'ol':
            let itemIndex = 1
            for (const child of Array.from(element.children)) {
              if (child.tagName.toLowerCase() === 'li') {
                const listItemText = processNode(child, indent)
                if (listItemText.trim()) {
                  result += `${'  '.repeat(indent)}${itemIndex}. ${listItemText}\n`
                  itemIndex++
                }
              }
            }
            return result
            
          case 'li':
            for (const child of Array.from(element.childNodes)) {
              result += processNode(child, indent + 1)
            }
            return result
            
          case 'p':
            const pText = Array.from(element.childNodes).map(child => processNode(child, indent)).join('')
            return pText.trim() ? `${pText}\n` : ''
            
          default:
            for (const child of Array.from(element.childNodes)) {
              result += processNode(child, indent)
            }
            return result
        }
      }
      
      return ''
    }
    
    if (container) {
      return Array.from(container.childNodes).map(child => processNode(child)).join('')
    }
    
    return ''
  }

  const handleSaveResume = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      if (currentResumeId) {
        // Update existing resume
        trackerRef.current.recordEdit(); // Record edit on save
        ResumeStorage.updateResume(currentResumeId, resumeSections, trackerRef.current.getSession())
        setSaveMessage('Resume updated successfully!')
      } else {
        // Create new resume
        trackerRef.current.recordEdit(); // Record edit on save
        const newId = ResumeStorage.saveResume(resumeTitle, resumeSections, trackerRef.current.getSession())
        setCurrentResumeId(newId)
        setSaveMessage('Resume saved successfully!')
      }
      updateStats(); // Update stats after recording edit
    } catch (error) {
      setSaveMessage('Failed to save resume. Please try again.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleNewResume = () => {
    console.log('🆕 New Resume button clicked')
    
    // Clear any save messages
    setSaveMessage('')
    
    // Clear current state immediately for instant feedback
    setCurrentResumeId(null)
    setResumeTitle('Your Name')
    setResumeSections(defaultResumeTemplate.map(section => ({ ...section, content: '' })))
    
    // Navigate to editor with new parameter to ensure fresh start
    router.push('/editor?new=true')
  }

  const handleExportPDF = async () => {
    if (!currentResumeId) {
      setSaveMessage('Please save your resume first before exporting to PDF.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    // Check subscription status (both local and Stripe)
    const canExport = await checkCanExportPDF()
    if (!canExport) {
      setSaveMessage('PDF export requires RealCV Pro subscription.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    setIsExporting(true)
    setSaveMessage('')

    try {
      // Ensure resume is saved with latest content
      ResumeStorage.updateResume(currentResumeId, resumeSections, trackerRef.current.getSession())
      
      await PDFExporter.exportToPDF({
        sections: resumeSections,
        session: trackerRef.current.getSession(),
        title: resumeTitle,
        resumeId: currentResumeId
      })
      
      setSaveMessage('PDF exported successfully!')
    } catch (error) {
      console.error('PDF export failed:', error)
      setSaveMessage('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  // TXT Export
  const handleExportTXT = async () => {
    console.log('TXT Export function called!')
    
    // Use exact same logic as PDF export
    if (!currentResumeId) {
      setSaveMessage('Please save your resume first before exporting to TXT.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    // Check subscription status (both local and Stripe) - exact same as PDF
    const canExport = await checkCanExportPDF()
    if (!canExport) {
      setSaveMessage('TXT export requires RealCV Pro subscription.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }
    let txt = `${resumeTitle}\n\n`;
    resumeSections.forEach((section, index) => {
      if (section.content.trim()) {
        // Convert HTML to formatted plain text
        const formattedText = convertHtmlToText(section.content);
        txt += `${section.title}\n${formattedText}\n`;
        
        // Add line divider between sections (except for the last section)
        const isLastSection = index === resumeSections.length - 1
        if (!isLastSection) {
          txt += '─'.repeat(50) + '\n\n';
        }
      }
    });
    // --- Append certificate/footer info ---
    const resumeId = currentResumeId || 'unsaved';
    console.log('TXT Export - Resume ID:', resumeId);
    const documentCode = DocumentCodeManager.createDocumentCode(resumeId);
    console.log('TXT Export - Document Code:', documentCode);
    const verificationUrl = `${window.location.origin}/verify/${documentCode}`;
    const trustTier = trackerRef.current.getTrustTier();
    txt += '---\n';
    txt += 'Human-Verified Resume Certificate\n';
    txt += `Document Code: ${documentCode}\n`;
    txt += `Trust Level: ${trustTier.label}\n`;
    txt += `• Written in ${sessionStats.typingTimeMinutes} minutes of active typing\n`;
    txt += `• ${sessionStats.editCount} revisions made\n`;
    txt += `• ${sessionStats.totalPastes} paste events\n`;
    txt += `• ${sessionStats.largePastes} large paste events (>100 chars)\n`;
    txt += `• ${sessionStats.keystrokes} total keystrokes\n`;
    txt += `Verify online: ${verificationUrl}\n`;
    txt += 'Generated with RealCV — the trust layer for human-created resumes\n';
    txt += `Document ID: ${resumeId} | Generated: ${new Date().toLocaleDateString()}\n`;
    // --- End certificate/footer ---
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_verified.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaveMessage('TXT exported successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Convert HTML to Word document formatting
  const convertHtmlToWord = (html: string): Paragraph[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
    const container = doc.querySelector('div')
    
    const paragraphs: Paragraph[] = []
    
    const processNode = (node: Node, currentRuns: TextRun[] = []): TextRun[] => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text) {
          currentRuns.push(new TextRun(text))
        }
        return currentRuns
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        
        switch (element.tagName.toLowerCase()) {
          case 'strong':
          case 'b':
            const boldText = element.textContent?.trim()
            if (boldText) {
              currentRuns.push(new TextRun({ text: boldText, bold: true }))
            }
            break
            
          case 'em':
          case 'i':
            const italicText = element.textContent?.trim()
            if (italicText) {
              currentRuns.push(new TextRun({ text: italicText, italics: true }))
            }
            break
            
          case 'u':
            const underlineText = element.textContent?.trim()
            if (underlineText) {
              currentRuns.push(new TextRun({ text: underlineText, underline: {} }))
            }
            break
            
          case 'ul':
          case 'ol':
            let itemIndex = 1
            for (const child of Array.from(element.children)) {
              if (child.tagName.toLowerCase() === 'li') {
                const bullet = element.tagName.toLowerCase() === 'ul' ? '• ' : `${itemIndex}. `
                const listItemRuns = [new TextRun(bullet)]
                for (const listChild of Array.from(child.childNodes)) {
                  processNode(listChild, listItemRuns)
                }
                paragraphs.push(new Paragraph({ children: listItemRuns, spacing: { after: 100 } }))
                itemIndex++
              }
            }
            break
            
          case 'p':
            const pRuns: TextRun[] = []
            for (const child of Array.from(element.childNodes)) {
              processNode(child, pRuns)
            }
            if (pRuns.length > 0) {
              paragraphs.push(new Paragraph({ children: pRuns, spacing: { after: 100 } }))
            }
            break
            
          default:
            for (const child of Array.from(element.childNodes)) {
              processNode(child, currentRuns)
            }
            break
        }
      }
      
      return currentRuns
    }
    
    if (container) {
      const runs: TextRun[] = []
      for (const child of Array.from(container.childNodes)) {
        processNode(child, runs)
      }
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({ children: runs }))
      }
    }
    
    return paragraphs
  }

  // Word Export
  const handleExportWord = async () => {
    console.log('Word Export function called!')
    
    // Use exact same logic as PDF export
    if (!currentResumeId) {
      setSaveMessage('Please save your resume first before exporting to Word.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    // Check subscription status (both local and Stripe) - exact same as PDF
    const canExport = await checkCanExportPDF()
    if (!canExport) {
      setSaveMessage('Word export requires RealCV Pro subscription.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }
    setIsExporting(true);
    setSaveMessage('');
    try {
      const resumeId = currentResumeId || 'unsaved';
      const documentCode = DocumentCodeManager.createDocumentCode(resumeId);
      const verificationUrl = `${window.location.origin}/verify/${documentCode}`;
      const trustTier = trackerRef.current.getTrustTier();
      const certificateParagraphs = [
        new Paragraph({ text: '---', spacing: { after: 200 } }),
        new Paragraph({ text: 'Human-Verified Resume Certificate', heading: 'Heading1', spacing: { after: 200 } }),
        new Paragraph({ text: `Document Code: ${documentCode}`, spacing: { after: 100 } }),
        new Paragraph({ text: `Trust Level: ${trustTier.label}`, spacing: { after: 100 } }),
        new Paragraph({ text: `• Written in ${sessionStats.typingTimeMinutes} minutes of active typing` }),
        new Paragraph({ text: `• ${sessionStats.editCount} revisions made` }),
        new Paragraph({ text: `• ${sessionStats.totalPastes} paste events` }),
        new Paragraph({ text: `• ${sessionStats.largePastes} large paste events (>100 chars)` }),
        new Paragraph({ text: `• ${sessionStats.keystrokes} total keystrokes`, spacing: { after: 100 } }),
        new Paragraph({ text: `Verify online: ${verificationUrl}` }),
        new Paragraph({ text: 'Generated with RealCV — the trust layer for human-created resumes' }),
        new Paragraph({ text: `Document ID: ${resumeId} | Generated: ${new Date().toLocaleDateString()}` })
      ];
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: resumeTitle,
                heading: 'Heading1',
                spacing: { after: 300 },
              }),
              ...resumeSections.filter(s => s.content.trim()).flatMap((section, index, filteredSections) => {
                const sectionParagraphs = [
                  new Paragraph({
                    text: section.title,
                    heading: 'Heading2',
                    spacing: { after: 100 },
                  }),
                  ...convertHtmlToWord(section.content)
                ]
                
                // Add line divider between sections (except for the last section)
                const isLastSection = index === filteredSections.length - 1
                if (!isLastSection) {
                  sectionParagraphs.push(
                    new Paragraph({
                      text: '─'.repeat(50),
                      spacing: { before: 200, after: 200 },
                    })
                  )
                }
                
                return sectionParagraphs
              }),
              ...certificateParagraphs
            ]
          }
        ]
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_verified.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveMessage('Word exported successfully!');
    } catch (error) {
      setSaveMessage('Failed to export Word. Please try again.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Update subscription status periodically
  useEffect(() => {
    const updateSubscriptionStatus = async () => {
      setSubscriptionStatus(SubscriptionManager.getSubscriptionStatus())
      await checkCanExportPDF(true) // Update export capability
    }

    // Check immediately on mount
    updateSubscriptionStatus()

    const interval = setInterval(updateSubscriptionStatus, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const trustTier = trackerRef.current.getTrustTier()

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <h2 className={`${styles.loadingTitle} ${geistSans.className} ${geistMono.className}`}>RealCV</h2>
          <p className={styles.loadingText}>Loading your resume editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.editorContainer}>
          {/* Main Editor */}
          <div className={styles.editorMain}>
            {/* Title Section */}
            <div className={styles.titleSection}>
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                className={styles.titleInput}
                placeholder="Your Name"
              />
            </div>
            {/* Resume Sections */}
            <div className={styles.sectionsContainer}>
              {resumeSections.map((section) => (
                <ResumeSection
                  key={section.id}
                  section={section}
                  onUpdate={handleSectionUpdate}
                  onKeystroke={handleKeystroke}
                  onPaste={handlePaste}
                />
              ))}
            </div>
            {/* Actions */}
            <div className={styles.actionsContainer}>
              {/* Save Message */}
              {saveMessage && (
                <div className={`${styles.message} ${
                  saveMessage.includes('success') ? styles.messageSuccess : styles.messageError
                }`}>
                  {saveMessage}
                </div>
              )}
              {/* Action Buttons */}
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleSaveResume}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={handleNewResume}
                  className={`${styles.button} ${styles.buttonSecondary}`}
                >
                  New Resume
                </button>
                <button 
                  onClick={() => setShowPreview(true)}
                  className={`${styles.button} ${styles.buttonSecondary}`}
                >
                  Preview PDF
                </button>
                <button
                  onClick={(e) => {
                    console.log('🔥 TXT Export button clicked!', 'isExporting:', isExporting)
                    e.preventDefault()
                    e.stopPropagation()
                    handleExportTXT()
                  }}
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  type="button"
                >
                  Export as TXT
                </button>
                <button
                  onClick={(e) => {
                    console.log('🔥 Word Export button clicked!', 'isExporting:', isExporting)
                    e.preventDefault()
                    e.stopPropagation()
                    handleExportWord()
                  }}
                  className={`${styles.button} ${styles.buttonSecondary}`}
                  type="button"
                >
                  Export as Word
                </button>
              </div>
            </div>
          </div>
          {/* Sidebar - Analytics */}
          <div className={styles.sidebar}>
            <div className={styles.statsPanel}>
              <h3 className={styles.statsPanelTitle}>Writing Analytics</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Typing Time</div>
                  <div className={styles.statValue}>{sessionStats.typingTimeMinutes}m</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Edits</div>
                  <div className={styles.statValue}>{sessionStats.editCount}</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Keystrokes</div>
                  <div className={styles.statValue}>{sessionStats.keystrokes.toLocaleString()}</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Copy/Paste</div>
                  <div className={styles.statValue}>{sessionStats.totalPastes}</div>
                  <div className={styles.statValue} style={{fontSize: '0.9em', color: '#666'}}>{sessionStats.smallPastes} (&lt; 100 chars)</div>
                  <div className={styles.statValue} style={{fontSize: '0.9em', color: '#666'}}>{sessionStats.largePastes} (&gt; 100 chars)</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Word Count</div>
                  <div className={`${styles.statValue} ${(sessionStats.wordCount || 0) > 600 ? styles.warningText : ''}`}>
                    {(sessionStats.wordCount || 0).toLocaleString()}
                    {(sessionStats.wordCount || 0) > 600 && <span style={{fontSize: '0.8em', color: '#ef4444', display: 'block'}}>⚠️ Over 600 words</span>}
                  </div>
                </div>
              </div>
              {pasteError && (
                <div className={styles.messageError} style={{marginTop: 8}}>{pasteError}</div>
              )}
              <div className={`${styles.trustBadge} ${
                trustTier.tier === 3 ? styles.tier3 :
                trustTier.tier === 2 ? styles.tier2 :
                styles.tier1
              }`}>
                Tier {trustTier.tier}
              </div>
              <div className={styles.trustLabel}>
                {trustTier.label}
              </div>
            </div>
            {/* Subscription Status */}
            <div className={styles.subscriptionPanel}>
              {!subscriptionStatus.isActive ? (
                <div className={`${styles.subscriptionBanner} ${styles.free}`}>
                  <div className={styles.subscriptionContent}>
                    <div className={styles.subscriptionTitle}>Free Plan</div>
                    <div className={styles.subscriptionSubtitle}>
                      Upgrade to export verified PDFs
                    </div>
                  </div>
                  <a href="/pricing" className={`${styles.button} ${styles.buttonWarning} ${styles.buttonSmall}`}>
                    Upgrade
                  </a>
                </div>
              ) : (
                <div className={`${styles.subscriptionBanner} ${styles.pro}`}>
                  <div className={styles.subscriptionContent}>
                    <div className={styles.subscriptionTitle}>RealCV Pro</div>
                    <div className={styles.subscriptionSubtitle}>
                      {typeof (subscriptionStatus as any).daysRemaining === 'number' && (subscriptionStatus as any).daysRemaining > 0
                        ? `${(subscriptionStatus as any).daysRemaining} days remaining`
                        : 'Active subscription'}
                    </div>
                  </div>
                  <div className={styles.subscriptionCheck}>✓</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* PDF Preview Modal */}
      <ResumePreview
        sections={resumeSections}
        title={resumeTitle}
        session={trackerRef.current.getSession()}
        isVisible={showPreview}
        onClose={() => setShowPreview(false)}
        onExportPDF={async () => {
          const canExport = await checkCanExportPDF()
          if (!canExport) {
            setShowPreview(false);
            router.push('/pricing');
            return;
          }
          if (!currentResumeId) {
            setSaveMessage('Please save your resume first before exporting to PDF.');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
          }
          setIsExporting(true);
          setSaveMessage('');
          try {
            ResumeStorage.updateResume(currentResumeId, resumeSections, trackerRef.current.getSession());
            await PDFExporter.exportToPDF({
              sections: resumeSections,
              session: trackerRef.current.getSession(),
              title: resumeTitle,
              resumeId: currentResumeId
            });
            setSaveMessage('PDF exported successfully!');
            setShowPreview(false); // Close modal after export
          } catch (error) {
            console.error('PDF export failed from preview modal:', error);
            setSaveMessage('Failed to export PDF. Please try again.');
          } finally {
            setIsExporting(false);
            setTimeout(() => setSaveMessage(''), 3000);
          }
        }}
        canExportPDF={canExportPDF}
        isExporting={isExporting}
      />
    </div>
  )
}