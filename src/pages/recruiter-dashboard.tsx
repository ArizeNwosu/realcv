import { useState, useEffect } from 'react'
import Head from 'next/head'
import { ResponsePortalManager, QuestionSet, CandidateSubmission } from '../lib/responsePortal'

export default function RecruiterDashboard() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [submissions, setSubmissions] = useState<CandidateSubmission[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null)
  const [title, setTitle] = useState('Software Engineer Follow-up Questions')
  const [questions, setQuestions] = useState([
    'Describe a challenging technical problem you solved recently and walk me through your approach.',
    'How do you stay current with new technologies and programming trends?',
    'Tell me about a time when you had to debug a complex issue. What tools did you use?'
  ])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Get both client-side and demo question sets
    const allQuestionSets = ResponsePortalManager.getAllQuestionSets()
    
    // Always include the demo question set in the dashboard
    const demoQuestionSet = {
      id: 'demo_qs_1',
      token: 'resp_demo123',
      title: 'Demo Software Engineer Questions',
      questions: [
        {
          id: 'demo_q_1',
          text: 'Describe a challenging technical problem you solved recently and walk me through your approach.',
          order: 1
        },
        {
          id: 'demo_q_2', 
          text: 'How do you stay current with new technologies and programming trends?',
          order: 2
        }
      ],
      createdBy: 'demo@realcv.com',
      createdAt: Date.now() - 3600000, // 1 hour ago
      expiresAt: Date.now() + (48 * 60 * 60 * 1000), // 48 hours from now
      isActive: true
    }
    
    // Check if demo already exists in the list to avoid duplicates
    const hasDemo = allQuestionSets.some(qs => qs.token === 'resp_demo123')
    const finalQuestionSets = hasDemo ? allQuestionSets : [demoQuestionSet, ...allQuestionSets]
    
    setQuestionSets(finalQuestionSets)
    setSubmissions(ResponsePortalManager.getAllSubmissions())
  }

  const createQuestionSet = () => {
    const questionData = questions
      .filter(q => q.trim())
      .map((text, index) => ({ text: text.trim(), order: index + 1 }))

    if (questionData.length === 0) {
      alert('Please add at least one question')
      return
    }

    const questionSet = ResponsePortalManager.createQuestionSet(
      title,
      questionData,
      'recruiter@realcv.com',
      48 // 48 hours expiry
    )

    resetForm()
    loadData()

    alert(`Question set created! Share this URL with candidates:\n${window.location.origin}/respond/${questionSet.token}`)
  }

  const startEdit = (questionSet: QuestionSet) => {
    setEditingSet(questionSet)
    setTitle(questionSet.title)
    setQuestions(questionSet.questions.sort((a, b) => a.order - b.order).map(q => q.text))
    setShowCreateForm(true)
  }

  const saveEdit = () => {
    if (!editingSet) return

    const questionData = questions
      .filter(q => q.trim())
      .map((text, index) => ({ text: text.trim(), order: index + 1 }))

    if (questionData.length === 0) {
      alert('Please add at least one question')
      return
    }

    // Update the existing question set
    const allSets = ResponsePortalManager.getAllQuestionSets()
    const updatedSets = allSets.map(qs => {
      if (qs.id === editingSet.id) {
        return {
          ...qs,
          title,
          questions: questionData.map((q, index) => ({
            id: `q_${index}_${Math.random().toString(36).substr(2, 6)}`,
            text: q.text,
            order: q.order
          }))
        }
      }
      return qs
    })

    localStorage.setItem('realcv_question_sets', JSON.stringify(updatedSets))
    
    resetForm()
    loadData()
    alert('Question set updated successfully!')
  }

  const resetForm = () => {
    setShowCreateForm(false)
    setEditingSet(null)
    setTitle('Software Engineer Follow-up Questions')
    setQuestions([
      'Describe a challenging technical problem you solved recently and walk me through your approach.',
      'How do you stay current with new technologies and programming trends?',
      'Tell me about a time when you had to debug a complex issue. What tools did you use?'
    ])
  }

  const copyUrl = (token: string) => {
    const url = `${window.location.origin}/respond/${token}`
    navigator.clipboard.writeText(url)
    alert('URL copied to clipboard!')
  }

  const addQuestion = () => {
    setQuestions([...questions, ''])
  }

  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions]
    updated[index] = value
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const deleteQuestionSet = (questionSet: QuestionSet) => {
    if (!confirm('Are you sure you want to delete this question set? This action cannot be undone.')) {
      return
    }

    const allSets = ResponsePortalManager.getAllQuestionSets()
    const updatedSets = allSets.filter(qs => qs.id !== questionSet.id)
    localStorage.setItem('realcv_question_sets', JSON.stringify(updatedSets))
    loadData()
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <Head>
        <title>Recruiter Dashboard - RealCV</title>
      </Head>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: '0 0 16px 0', color: '#111827' }}>Recruiter Dashboard</h1>
        <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>Create question sets for candidates and view their responses with human verification scores.</p>
        
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <strong>🎯 Quick Test:</strong> Try the demo question set:{' '}
          <button
            onClick={() => copyUrl('resp_demo123')}
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Copy Demo Link
          </button>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '8px'
          }}
        >
          {showCreateForm ? 'Cancel' : '+ Create Question Set'}
        </button>
        
        {showCreateForm && (
          <button
            onClick={resetForm}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {showCreateForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>
            {editingSet ? 'Edit Question Set' : 'Create New Question Set'}
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Questions</label>
            {questions.map((question, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', minWidth: '40px', textAlign: 'center', color: '#6b7280' }}>
                  {index + 1}
                </span>
                <textarea
                  value={question}
                  onChange={(e) => updateQuestion(index, e.target.value)}
                  placeholder="Enter your question..."
                  rows={2}
                  style={{ flex: 1, padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
                />
                <button
                  onClick={() => removeQuestion(index)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={addQuestion}
              style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              + Add Question
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={editingSet ? saveEdit : createQuestionSet}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
            >
              {editingSet ? 'Save Changes' : 'Create Question Set'}
            </button>
            <button
              onClick={resetForm}
              style={{ background: '#6b7280', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Question Sets */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>Question Sets ({questionSets.length})</h2>
          
          {questionSets.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No question sets created yet.</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {questionSets.map((qs) => (
                <div key={qs.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 style={{ margin: '0', fontSize: '16px', color: '#111827' }}>{qs.title}</h3>
                    <span style={{ 
                      background: qs.isActive ? '#dcfce7' : '#fef2f2', 
                      color: qs.isActive ? '#166534' : '#991b1b',
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {qs.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#6b7280' }}>
                    {qs.questions.length} questions • Created {new Date(qs.createdAt).toLocaleDateString()}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => copyUrl(qs.token)}
                      style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => startEdit(qs)}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuestionSet(qs)}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Delete
                    </button>
                    <span style={{ fontSize: '12px', color: '#6b7280', padding: '6px 0' }}>
                      Responses: {submissions.filter(s => s.questionSetId === qs.id).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submissions */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>Recent Submissions ({submissions.length})</h2>
          
          {submissions.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No submissions yet.</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {submissions
                .sort((a, b) => b.submittedAt - a.submittedAt)
                .map((sub) => {
                  const questionSet = questionSets.find(qs => qs.id === sub.questionSetId)
                  return (
                    <div key={sub.id} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    onClick={() => window.open(`/response-details/${sub.id}`, '_blank')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#111827' }}>
                            {questionSet?.title || 'Unknown Question Set'}
                          </h3>
                          <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                            <strong style={{ color: '#374151' }}>
                              {sub.candidateFirstName && sub.candidateLastName 
                                ? `${sub.candidateFirstName} ${sub.candidateLastName}${sub.candidateEmail ? ` (${sub.candidateEmail})` : ''}`
                                : sub.candidateEmail || 'Anonymous'
                              }
                            </strong> • {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            background: getScoreColor(sub.overallScore),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {sub.overallScore.toFixed(0)}% Human
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div>📝 {sub.responses.length} responses</div>
                          {sub.flags.length > 0 && (
                            <div style={{ color: '#f59e0b', marginTop: '4px' }}>⚠️ {sub.flags.join(', ')}</div>
                          )}
                        </div>
                        <div style={{ color: '#3b82f6', fontSize: '11px' }}>Click to view details →</div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}