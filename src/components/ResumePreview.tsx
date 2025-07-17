import { ResumeSection } from '../lib/resumeTemplate'
import { WritingSession } from '../lib/tracking'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface ResumePreviewProps {
  sections: ResumeSection[]
  title: string
  session: WritingSession
  isVisible: boolean
  onClose: () => void
  onExportPDF: () => void
  canExportPDF: boolean
  isExporting: boolean
}

export default function ResumePreview({ 
  sections, 
  title, 
  session, 
  isVisible, 
  onClose, 
  onExportPDF,
  canExportPDF,
  isExporting
}: ResumePreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const resumeId = (typeof window !== 'undefined' && localStorage.getItem('realcv_current')) || '';
  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${resumeId}` : '';

  useEffect(() => {
    if (isVisible && verificationUrl) {
      QRCode.toDataURL(verificationUrl, { width: 120, margin: 2 })
        .then(setQrCodeUrl)
        .catch(() => setQrCodeUrl(null));
    }
  }, [isVisible, verificationUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const getTrustTier = () => {
    const typingMinutes = Math.round(session.totalTypingTime / 60000)
    const largePastes = session.pasteEvents.filter(p => p.textLength > 100).length
    
    if (typingMinutes >= 15 && session.editCount >= 3 && largePastes === 0) {
      return { tier: 3, label: "Tier 3: High Trust - Verified Human", color: "text-green-600" }
    } else if (typingMinutes >= 5 && session.editCount >= 2) {
      return { tier: 2, label: "Tier 2: Medium Trust - Process-Based Proof", color: "text-yellow-600" }
    } else {
      return { tier: 1, label: "Tier 1: Basic Trust - Limited Evidence", color: "text-gray-600" }
    }
  }

  const trustTier = getTrustTier()
  const typingMinutes = Math.round(session.totalTypingTime / 60000)

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center gap-2">
          <h2 className="text-xl font-semibold">PDF Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={onExportPDF}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center ${isExporting ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isExporting}
            >
              {isExporting ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : null}
              Export as PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-8" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          {/* Resume Content */}
          <div className="mb-8 bg-white" style={{ 
            fontFamily: 'Arial, sans-serif',
            maxWidth: '100%',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            <h1 
              className="text-2xl font-bold mb-2 text-gray-900 text-center"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                fontSize: '18px',
                letterSpacing: '1px'
              }}
            >
              {title}
            </h1>
            
            {sections.map((section) => {
              if (!section.content.trim()) return null
              
              // Special formatting for header section
              if (section.id === 'header') {
                return (
                  <div key={section.id} className="mb-8 text-center">
                    <div 
                      className="text-base text-gray-800"
                      style={{ 
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                        wordWrap: 'break-word'
                      }}
                    >
                      {stripHtml(section.content)}
                    </div>
                  </div>
                )
              }
              
              return (
                <div key={section.id} className="mb-6">
                  <h2 
                    className="text-base font-bold mb-3 text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1"
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      fontSize: '14px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {section.title}
                  </h2>
                  <div 
                    className="text-sm text-gray-800"
                    style={{ 
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      wordWrap: 'break-word',
                      fontSize: '11px'
                    }}
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              )
            })}
          </div>

          {/* Certificate Section */}
          <div className="border-t-2 border-gray-300 pt-8" style={{
            maxWidth: '100%',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            <h2 
              className="text-xl font-bold mb-6 text-gray-900"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%'
              }}
            >
              Human-Verified Resume Certificate
            </h2>
            
            <div className="space-y-4" style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%'
            }}>
              <div style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}>
                <span className="font-semibold">Document Code: </span>
                <span className="font-mono" style={{
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word'
                }}>{resumeId ? resumeId : 'XXXX-XXXX-XXXX'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Trust Level: </span>
                <span className={trustTier.color}>{trustTier.label}</span>
              </div>
              
              <div className="text-sm space-y-1">
                <div>• Written in {typingMinutes} minutes of active typing</div>
                <div>• {session.editCount} revisions made</div>
                <div>• {session.pasteEvents.length} paste events</div>
                <div>• {session.pasteEvents.filter(p => p.textLength > 100).length} large paste events (&gt;100 chars)</div>
                <div>• {session.keystrokes} total keystrokes</div>
              </div>
              {qrCodeUrl && (
                <div className="flex flex-col items-center mt-4">
                  <img src={qrCodeUrl} alt="QR code for verification" style={{ width: 120, height: 120, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  <div className="text-xs text-blue-700 mt-2">
                    <a href={verificationUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                      Verify Online
                    </a>
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-6" style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%'
              }}>
                <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  Generated with RealCV — the trust layer for human-created resumes
                </div>
                <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  Generated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}