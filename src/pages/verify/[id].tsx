import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ResumeStorage, SavedResume } from '../../lib/storage'
import { WritingSession } from '../../lib/tracking'
import { DocumentCodeManager } from '../../lib/documentCodes'

export default function VerifyResume() {
  const router = useRouter()
  const { id } = router.query
  const [resume, setResume] = useState<SavedResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || typeof id !== 'string') return

    try {
      let resumeId = id
      
      // If it's a 12-character code, try to resolve to resume ID
      if (id.length === 12 && /^[A-Z0-9]+$/.test(id)) {
        const resolvedId = DocumentCodeManager.getResumeIdByCode(id)
        if (resolvedId) {
          resumeId = resolvedId
        } else {
          setError('Document code not found or expired.')
          setLoading(false)
          return
        }
      }
      
      const foundResume = ResumeStorage.getResume(resumeId)
      if (foundResume) {
        setResume(foundResume)
      } else {
        setError('Resume not found or may have been deleted.')
      }
    } catch (err) {
      setError('Failed to load resume verification data.')
    } finally {
      setLoading(false)
    }
  }, [id])

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const getTrustTier = (session: WritingSession) => {
    const typingMinutes = Math.round(session.totalTypingTime / 60000)
    const largePastes = session.pasteEvents.filter(p => p.textLength > 100).length
    
    if (typingMinutes >= 15 && session.editCount >= 3 && largePastes === 0) {
      return { 
        tier: 3, 
        label: "High Trust - Verified Human", 
        color: "bg-green-100 text-green-800 border-green-200",
        description: "Strong evidence of human authorship with extensive writing time and minimal paste activity."
      }
    } else if (typingMinutes >= 5 && session.editCount >= 2) {
      return { 
        tier: 2, 
        label: "Medium Trust - Process-Based Proof", 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        description: "Moderate evidence of human authorship with reasonable writing behavior patterns."
      }
    } else {
      return { 
        tier: 1, 
        label: "Basic Trust - Limited Evidence", 
        color: "bg-gray-100 text-gray-800 border-gray-200",
        description: "Basic evidence of human authorship. Limited writing time or activity detected."
      }
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying resume...</p>
        </div>
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to RealCV Home
          </a>
        </div>
      </div>
    )
  }

  const trustTier = getTrustTier(resume.session)
  const typingMinutes = Math.round(resume.session.totalTypingTime / 60000)
  const sessionDuration = Math.round((resume.updatedAt - resume.session.startTime) / 60000)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Verification</h1>
              <p className="text-gray-600 mt-1">Human-verified resume authenticity report</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Powered by</div>
              <div className="text-lg font-bold text-blue-600">RealCV</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{resume.title}</h2>
              
              {resume.sections.map((section) => {
                if (!section.content.trim()) return null
                
                return (
                  <div key={section.id} className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {section.title}
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {stripHtml(section.content)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Authenticity Report */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Authenticity Report</h3>
              
              {/* Trust Tier */}
              <div className={`rounded-lg border p-4 mb-6 ${trustTier.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Trust Level</span>
                  <span className="text-sm font-medium">Tier {trustTier.tier}</span>
                </div>
                <div className="font-medium mb-2">{trustTier.label}</div>
                <div className="text-sm">{trustTier.description}</div>
              </div>

              {/* Writing Statistics */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Writing Behavior Analysis</h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Active Typing</div>
                    <div className="font-semibold">{typingMinutes} minutes</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">Total Session</div>
                    <div className="font-semibold">{sessionDuration} minutes</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">Revisions</div>
                    <div className="font-semibold">{resume.session.editCount}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">Keystrokes</div>
                    <div className="font-semibold">{resume.session.keystrokes.toLocaleString()}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">Paste Events</div>
                    <div className="font-semibold">{resume.session.pasteEvents.length}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">Large Pastes</div>
                    <div className="font-semibold text-orange-600">
                      {resume.session.pasteEvents.filter(p => p.textLength > 100).length}
                    </div>
                  </div>
                </div>

                <hr className="my-4" />

                {/* Verification Details */}
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-gray-600">Document ID:</span>
                    <span className="font-mono ml-2">{resume.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">{formatDate(resume.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2">{formatDate(resume.updatedAt)}</span>
                  </div>
                </div>

                <hr className="my-4" />

                {/* How it Works */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">How Verification Works</h5>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• Tracks real-time typing behavior</div>
                    <div>• Monitors edit patterns and revisions</div>
                    <div>• Detects paste events and content sources</div>
                    <div>• Calculates trust score based on human writing patterns</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  This verification report demonstrates that this resume was created through human writing processes, not AI generation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}