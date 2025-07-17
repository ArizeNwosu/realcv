import { useState, useEffect } from 'react'
import { ResumeStorage, SavedResume } from '../lib/storage'
import Link from 'next/link'

export default function Dashboard() {
  const [resumes, setResumes] = useState<SavedResume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResumes = () => {
      try {
        const savedResumes = ResumeStorage.getAllResumes()
        setResumes(savedResumes.sort((a, b) => b.updatedAt - a.updatedAt))
      } catch (error) {
        console.error('Failed to load resumes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResumes()
  }, [])

  const handleDeleteResume = (id: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      ResumeStorage.deleteResume(id)
      setResumes(prev => prev.filter(r => r.id !== id))
    }
  }

  const handleLoadResume = (id: string) => {
    localStorage.setItem('realcv_current', id)
    window.location.href = '/editor'
  }

  const handleCreateNewResume = () => {
    // Clear current resume to ensure a fresh start
    localStorage.removeItem('realcv_current')
    window.location.href = '/editor?new=true'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTrustBadge = (session: any) => {
    const minutes = Math.round(session.totalTypingTime / 60000)
    const largePastes = session.pasteEvents?.filter((p: any) => p.textLength > 100).length || 0
    
    let tier = 1
    let label = "Basic Trust"
    let color = "bg-gray-100 text-gray-800"
    
    if (minutes >= 15 && session.editCount >= 3 && largePastes === 0) {
      tier = 3
      label = "High Trust"
      color = "bg-green-100 text-green-800"
    } else if (minutes >= 5 && session.editCount >= 2) {
      tier = 2
      label = "Medium Trust"
      color = "bg-yellow-100 text-yellow-800"
    }

    return { tier, label, color }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">My Resumes</h1>
          <div className="flex gap-2">
            <Link 
              href="/profile"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Profile
            </Link>
            <Link 
              href="/subscription"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Subscription
            </Link>
            <button 
              onClick={handleCreateNewResume}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Resume
            </button>
          </div>
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No resumes found</div>
            <button 
              onClick={handleCreateNewResume}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => {
              const trustBadge = getTrustBadge(resume.session)
              const typingMinutes = Math.round(resume.session.totalTypingTime / 60000)
              
              return (
                <div key={resume.id} className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{resume.title}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${trustBadge.color}`}>
                      Tier {trustBadge.tier}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div>Updated: {formatDate(resume.updatedAt)}</div>
                    <div>Typing time: {typingMinutes}m</div>
                    <div>Edits: {resume.session.editCount}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadResume(resume.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteResume(resume.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}