import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { CandidateSubmission, ResponsePortalManager } from '../../lib/responsePortal'

interface ResponseDetailsProps {
  submission: CandidateSubmission | null
  error?: string
}

export default function ResponseDetails({ submission: initialSubmission, error }: ResponseDetailsProps) {
  const router = useRouter()
  const [submission, setSubmission] = useState<CandidateSubmission | null>(initialSubmission)
  const [loading, setLoading] = useState(!initialSubmission)

  useEffect(() => {
    if (!initialSubmission && router.query.submissionId) {
      // Load submission from localStorage
      const submissionId = router.query.submissionId as string
      const submissions = JSON.parse(localStorage.getItem('realcv_responses') || '[]')
      const foundSubmission = submissions.find((sub: CandidateSubmission) => sub.id === submissionId)
      
      setSubmission(foundSubmission || null)
      setLoading(false)
    }
  }, [router.query.submissionId, initialSubmission])

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui', textAlign: 'center' }}>
        <Head>
          <title>Loading Response Details - RealCV</title>
        </Head>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
          <h1>Loading response details...</h1>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
        <Head>
          <title>Response Details - RealCV</title>
        </Head>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444' }}>❌ Submission Not Found</h1>
          <p>{error || 'This submission could not be found.'}</p>
          <button
            onClick={() => router.push('/recruiter-dashboard')}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <Head>
        <title>Response Details - RealCV</title>
      </Head>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: '0', color: '#111827' }}>Response Analysis</h1>
          <button
            onClick={() => router.push('/recruiter-dashboard')}
            style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Candidate</div>
            <div style={{ fontWeight: '600', color: '#111827' }}>
              {submission.candidateFirstName && submission.candidateLastName 
                ? `${submission.candidateFirstName} ${submission.candidateLastName}${submission.candidateEmail ? ` (${submission.candidateEmail})` : ''}`
                : submission.candidateEmail || 'Anonymous'
              }
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Submitted</div>
            <div style={{ fontWeight: '600', color: '#111827' }}>{new Date(submission.submittedAt).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Overall Score</div>
            <div style={{ 
              background: getScoreColor(submission.overallScore), 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '6px', 
              fontWeight: '600',
              display: 'inline-block'
            }}>
              {submission.overallScore.toFixed(0)}% Human
            </div>
          </div>
        </div>
      </div>

      {/* Global Flags */}
      {submission.flags.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Detection Flags</h3>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#92400e' }}>
            {submission.flags.map((flag, index) => (
              <li key={index}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Response Details */}
      {submission.responses.map((response, index) => (
        <div key={response.questionId} style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>Question {index + 1}</h2>
          
          {/* Question */}
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '4px solid #3b82f6' }}>
            <strong style={{ color: '#374151' }}>{response.question}</strong>
          </div>

          {/* Response */}
          <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Candidate Response:</div>
            <div style={{ color: '#111827', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{response.response}</div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#1e40af', fontSize: '24px', fontWeight: '700' }}>{response.metrics.humanLikelihood}%</div>
              <div style={{ color: '#3b82f6', fontSize: '12px' }}>Human Likelihood</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#166534', fontSize: '24px', fontWeight: '700' }}>{response.metrics.effortScore}</div>
              <div style={{ color: '#16a34a', fontSize: '12px' }}>Effort Level</div>
            </div>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#dc2626', fontSize: '24px', fontWeight: '700' }}>{(response.metrics.aiSignatureScore * 100).toFixed(0)}%</div>
              <div style={{ color: '#ef4444', fontSize: '12px' }}>AI Signature</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: '#475569', fontSize: '24px', fontWeight: '700' }}>{response.response.trim().split(/\s+/).length}</div>
              <div style={{ color: '#64748b', fontSize: '12px' }}>Word Count</div>
            </div>
          </div>

          {/* Typing Analytics */}
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>📊 Typing Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#6b7280' }}>Keystrokes:</span> <strong>{response.session.keystrokes.length}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Backspaces:</span> <strong>{response.session.backspaces}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Edits:</span> <strong>{response.session.edits}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Paste Events:</span> <strong style={{ color: response.session.pasteEvents > 0 ? '#ef4444' : '#16a34a' }}>{response.session.pasteEvents}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Tab Switches:</span> <strong style={{ color: response.session.tabSwitches > 0 ? '#f59e0b' : '#16a34a' }}>{response.session.tabSwitches}</strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Typing Time:</span> <strong>{formatDuration(response.session.totalTypingTime)}</strong>
              </div>
            </div>

            {/* Response Flags */}
            {response.metrics.flags.length > 0 && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: '#fef3c7', borderRadius: '6px' }}>
                <strong style={{ color: '#92400e', fontSize: '12px' }}>Flags: </strong>
                <span style={{ color: '#92400e', fontSize: '12px' }}>{response.metrics.flags.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Technical Details */}
      <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', fontSize: '12px', color: '#6b7280' }}>
        <strong>Technical Details:</strong><br />
        IP Address: {submission.ipAddress || 'Unknown'}<br />
        User Agent: {submission.userAgent || 'Unknown'}<br />
        Submission ID: {submission.id}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { submissionId } = context.params!

  if (!submissionId || typeof submissionId !== 'string') {
    return {
      props: {
        submission: null,
        error: 'Invalid submission ID'
      }
    }
  }

  // For now, return null since we'll load from localStorage on client
  // In a real app, this would fetch from database
  return {
    props: {
      submission: null,
      submissionId
    }
  }
}