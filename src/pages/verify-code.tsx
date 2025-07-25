import { useState } from 'react'
import { useRouter } from 'next/router'
import { DocumentCodeManager } from '../lib/documentCodes'

export default function VerifyCode() {
  const [documentCode, setDocumentCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!documentCode.trim()) {
      setError('Please enter a document code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const code = documentCode.toUpperCase()
      
      // Check if it's the demo verification code
      if (code === 'WG2025REAL01') {
        router.push(`/verify-demo/${code}`)
        return
      }
      
      // Check regular document codes
      const resumeId = DocumentCodeManager.getResumeIdByCode(code)
      
      if (resumeId) {
        router.push(`/verify/${resumeId}`)
      } else {
        setError('Document code not found. Please check the code and try again.')
      }
    } catch (err) {
      setError('Failed to verify document code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCodeInput = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const clean = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    // Limit to 12 characters
    return clean.substring(0, 12)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCodeInput(e.target.value)
    setDocumentCode(formatted)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-blue-600 mb-2">RealCV</div>
          <h1 className="text-xl font-bold text-gray-900">Verify Resume</h1>
          <p className="text-gray-600 mt-2">
            Enter the document code from a RealCV-generated resume to verify its authenticity
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Document Code
            </label>
            <input
              type="text"
              id="code"
              value={documentCode}
              onChange={handleCodeChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg tracking-wider"
              placeholder="AB19F8C392XZ"
              maxLength={12}
            />
            <div className="text-xs text-gray-500 mt-1">
              Format: 12 alphanumeric characters
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || documentCode.length < 12}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
          >
            {loading ? 'Verifying...' : 'Verify Resume'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">🎭 Try the Demo!</div>
            <div>
              Enter <strong>WG2025REAL01</strong> to see a live verification example of Bill Gates' resume.
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600 space-y-2">
            <div className="font-medium">What is a document code?</div>
            <div>
              Document codes are unique identifiers generated for each RealCV resume. 
              They allow employers to verify that a resume was authentically written by a human, 
              not generated by AI.
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to RealCV Home
          </a>
        </div>
      </div>
    </div>
  )
}