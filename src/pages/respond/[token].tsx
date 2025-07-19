import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Question, QuestionSet, ResponsePortalManager } from '../../lib/responsePortal'
import styles from '../../styles/respond.module.css'

interface ResponsePageProps {
  // No longer using SSR props
}

interface ResponseState {
  [questionId: string]: string
}

export default function ResponsePage({}: ResponsePageProps) {
  const router = useRouter()
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<ResponseState>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [candidateFirstName, setCandidateFirstName] = useState('')
  const [candidateLastName, setCandidateLastName] = useState('')

  const textareaRefs = useRef<{ [questionId: string]: HTMLTextAreaElement | null }>({})
  const [telemetryData, setTelemetryData] = useState<{ [questionId: string]: any }>({})

  // Load question set on client side
  useEffect(() => {
    if (router.query.token && typeof router.query.token === 'string') {
      const token = router.query.token
      console.log('🔍 Looking for token:', token)
      
      try {
        // Debug: Check what's in localStorage
        const allQuestionSets = ResponsePortalManager.getAllQuestionSets()
        console.log('📦 All question sets in localStorage:', allQuestionSets)
        console.log('🔍 Available tokens:', allQuestionSets.map(qs => qs.token))
        
        const qs = ResponsePortalManager.getQuestionSetByToken(token)
        if (qs) {
          console.log('✅ Found question set:', qs)
          setQuestionSet(qs)
          setError(null)
        } else {
          console.log('❌ Question set not found for token:', token)
          setError(`Question set not found or expired. Token: ${token}`)
        }
      } catch (err) {
        console.error('❌ Error loading question set:', err)
        setError('Failed to load question set')
      }
      setLoading(false)
    }
  }, [router.query.token])

  // Initialize telemetry data for each question
  useEffect(() => {
    if (questionSet) {
      const initialData: { [questionId: string]: any } = {}
      questionSet.questions.forEach(question => {
        initialData[question.id] = {
          isTracking: false,
          tabSwitches: 0,
          session: {
            questionId: question.id,
            startTime: 0,
            keystrokes: [],
            edits: 0,
            backspaces: 0,
            deletions: 0,
            pasteEvents: 0,
            tabSwitches: 0,
            totalTypingTime: 0,
            averagePauseMs: 0,
            longestPauseMs: 0,
            textLength: 0,
            finalText: ''
          }
        }
      })
      setTelemetryData(initialData)
    }
  }, [questionSet])

  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Loading... - RealCV</title>
        </Head>
        <div className={styles.errorContainer}>
          <h1>Loading...</h1>
          <p>Please wait while we load your questions.</p>
        </div>
      </div>
    )
  }

  if (error || !questionSet) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Response Portal - RealCV</title>
        </Head>
        <div className={styles.errorContainer}>
          <h1>❌ Invalid Link</h1>
          <p>{error || 'This response link is invalid or has expired.'}</p>
          <p>Please contact the recruiter for a valid link.</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questionSet.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questionSet.questions.length - 1
  const currentTelemetry = telemetryData[currentQuestion.id]

  const handleTextChange = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
    
    // Start tracking on first keystroke
    if (telemetryData[questionId] && !telemetryData[questionId].isTracking && value.length > 0) {
      setTelemetryData(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isTracking: true,
          session: {
            ...prev[questionId].session,
            startTime: Date.now()
          }
        }
      }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, questionId: string) => {
    if (telemetryData[questionId]) {
      const keystroke = {
        timestamp: Date.now(),
        type: 'keydown' as const,
        key: e.key,
        textLength: e.currentTarget.value.length,
        cursorPosition: e.currentTarget.selectionStart
      }
      
      setTelemetryData(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          session: {
            ...prev[questionId].session,
            keystrokes: [...prev[questionId].session.keystrokes, keystroke],
            backspaces: e.key === 'Backspace' ? prev[questionId].session.backspaces + 1 : prev[questionId].session.backspaces,
            deletions: e.key === 'Delete' ? prev[questionId].session.deletions + 1 : prev[questionId].session.deletions
          }
        }
      }))
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, questionId: string) => {
    // Prevent pasting entirely to ensure authentic responses
    e.preventDefault()
    alert('Pasting is disabled to ensure authentic responses. Please type your answer manually.')
    
    // Still track the paste attempt for scoring
    if (telemetryData[questionId]) {
      setTelemetryData(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          session: {
            ...prev[questionId].session,
            pasteEvents: prev[questionId].session.pasteEvents + 1
          }
        }
      }))
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questionSet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Check if this email has already submitted for this question set
      if (candidateEmail) {
        const existingSubmissions = JSON.parse(localStorage.getItem('realcv_responses') || '[]')
        const duplicateSubmission = existingSubmissions.find((sub: any) => 
          sub.token === questionSet.token && 
          sub.candidateEmail === candidateEmail
        )
        
        if (duplicateSubmission) {
          throw new Error('This email address has already submitted a response for this question set.')
        }
      }
      // Collect sessions for all questions
      const submissionData = questionSet.questions.map(question => {
        const response = responses[question.id] || ''
        const telemetry = telemetryData[question.id]
        
        const session = telemetry ? {
          ...telemetry.session,
          endTime: Date.now(),
          textLength: response.length,
          finalText: response,
          totalTypingTime: telemetry.session.startTime ? Date.now() - telemetry.session.startTime : 0
        } : {
          questionId: question.id,
          startTime: Date.now(),
          keystrokes: [],
          edits: 0,
          backspaces: 0,
          deletions: 0,
          pasteEvents: 0,
          tabSwitches: 0,
          totalTypingTime: 0,
          averagePauseMs: 0,
          longestPauseMs: 0,
          textLength: response.length,
          finalText: response
        }

        return {
          questionId: question.id,
          question: question.text,
          response,
          session
        }
      })

      const submitPayload = {
        token: questionSet.token,
        responses: submissionData,
        candidateEmail: candidateEmail || undefined,
        candidateFirstName: candidateFirstName || undefined,
        candidateLastName: candidateLastName || undefined
      }

      console.log('Submitting payload:', submitPayload)

      const response = await fetch('/api/submit-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Submission failed')
      }

      const result = await response.json()
      console.log('✅ Response submitted successfully:', result)

      // Store the complete submission data from server in localStorage
      if (typeof window !== 'undefined' && result.submission) {
        const existingSubmissions = JSON.parse(localStorage.getItem('realcv_responses') || '[]')
        const updatedSubmissions = [...existingSubmissions, result.submission]
        localStorage.setItem('realcv_responses', JSON.stringify(updatedSubmissions))
        console.log('📦 Stored submission with server data:', result.submission)
      }

      setIsSubmitted(true)

    } catch (error) {
      console.error('❌ Submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit response')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Response Submitted - RealCV</title>
        </Head>
        <div className={styles.successContainer}>
          <h1>✅ Response Submitted</h1>
          <p>Thank you for completing the follow-up questions.</p>
          <p>Your responses have been submitted successfully and will be reviewed by the recruiter.</p>
          <div className={styles.submissionInfo}>
            <small>
              Your responses were analyzed for authenticity and effort as part of our human verification process.
            </small>
          </div>
        </div>
      </div>
    )
  }

  const currentResponse = responses[currentQuestion.id] || ''
  const allQuestionsAnswered = questionSet.questions.every(q => 
    responses[q.id] && responses[q.id].trim().length > 0
  )

  return (
    <div className={styles.container}>
      <Head>
        <title>{questionSet.title} - RealCV Response Portal</title>
      </Head>

      {/* Anti-cheat notice */}
      <div className={styles.noticeBar}>
        <span className={styles.noticeIcon}>🔍</span>
        Note: This response will be analyzed for effort and authenticity.
      </div>

      <div className={styles.header}>
        <h1>{questionSet.title}</h1>
        <div className={styles.progress}>
          Question {currentQuestionIndex + 1} of {questionSet.questions.length}
        </div>
      </div>

      <div className={styles.questionContainer}>
        <div className={styles.questionHeader}>
          <h2>Question {currentQuestion.order}</h2>
          {currentTelemetry?.isTracking && (
            <div className={styles.trackingIndicator}>
              <span className={styles.recordingDot}></span>
              Recording response...
            </div>
          )}
        </div>

        <div className={styles.questionText}>
          {currentQuestion.text}
        </div>

        <textarea
          ref={el => textareaRefs.current[currentQuestion.id] = el}
          className={styles.responseTextarea}
          value={currentResponse}
          onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, currentQuestion.id)}
          onPaste={(e) => handlePaste(e, currentQuestion.id)}
          placeholder="Type your response here..."
          rows={8}
        />

        <div className={styles.responseInfo}>
          <span>Words: {currentResponse.trim().split(/\s+/).filter(w => w.length > 0).length}</span>
          {currentTelemetry?.tabSwitches > 0 && (
            <span className={styles.tabSwitchWarning}>
              ⚠️ {currentTelemetry.tabSwitches} tab switch{currentTelemetry.tabSwitches !== 1 ? 'es' : ''} detected
            </span>
          )}
        </div>
      </div>

      <div className={styles.navigation}>
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={styles.navButton}
        >
          ← Previous
        </button>

        <div className={styles.questionDots}>
          {questionSet.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`${styles.questionDot} ${
                index === currentQuestionIndex ? styles.active : ''
              } ${
                responses[questionSet.questions[index].id]?.trim() ? styles.answered : ''
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {isLastQuestion ? (
          <div className={styles.submitSection}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="First Name (required)"
                value={candidateFirstName}
                onChange={(e) => setCandidateFirstName(e.target.value)}
                className={styles.emailInput}
                required
              />
              <input
                type="text"
                placeholder="Last Name (required)"
                value={candidateLastName}
                onChange={(e) => setCandidateLastName(e.target.value)}
                className={styles.emailInput}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email address (required)"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              className={styles.emailInput}
              style={{ marginBottom: '12px' }}
              required
            />
            <button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered || !candidateEmail.trim() || !candidateFirstName.trim() || !candidateLastName.trim() || isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            disabled={!currentResponse.trim()}
            className={styles.navButton}
          >
            Next →
          </button>
        )}
      </div>

      {submitError && (
        <div className={styles.errorMessage}>
          ❌ {submitError}
        </div>
      )}

      {isLastQuestion && (!allQuestionsAnswered || !candidateEmail.trim() || !candidateFirstName.trim() || !candidateLastName.trim()) && (
        <div className={styles.warningMessage}>
          {!allQuestionsAnswered && 'Please answer all questions before submitting.'}
          {allQuestionsAnswered && (!candidateFirstName.trim() || !candidateLastName.trim() || !candidateEmail.trim()) && 'Please provide your full name and email address to submit.'}
        </div>
      )}
    </div>
  )
}

// No longer using getServerSideProps - using client-side loading instead