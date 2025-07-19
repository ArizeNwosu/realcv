export interface TypingSession {
  questionId: string
  startTime: number
  endTime?: number
  keystrokes: any[]
  edits: number
  backspaces: number
  deletions: number
  pasteEvents: number
  tabSwitches: number
  totalTypingTime: number
  averagePauseMs: number
  longestPauseMs: number
  textLength: number
  finalText: string
}

export interface TypingMetrics {
  humanLikelihood: number
  effortScore: 'Low' | 'Medium' | 'High'
  aiSignatureScore: number
  suspiciousPasting: boolean
  flags: string[]
}

export interface Question {
  id: string
  text: string
  order: number
}

export interface QuestionSet {
  id: string
  token: string
  title: string
  questions: Question[]
  createdBy: string
  createdAt: number
  expiresAt?: number
  isActive: boolean
}

export interface ResponseData {
  questionId: string
  question: string
  response: string
  metrics: TypingMetrics
  session: TypingSession
  submittedAt: number
}

export interface CandidateSubmission {
  id: string
  questionSetId: string
  token: string
  candidateEmail?: string
  candidateFirstName?: string
  candidateLastName?: string
  responses: ResponseData[]
  submittedAt: number
  ipAddress?: string
  userAgent?: string
  overallScore: number
  flags: string[]
}

const STORAGE_KEY_QUESTIONS = 'realcv_question_sets'
const STORAGE_KEY_RESPONSES = 'realcv_responses'

export class ResponsePortalManager {
  static generateToken(): string {
    return 'resp_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36)
  }

  static createQuestionSet(
    title: string, 
    questions: Omit<Question, 'id'>[], 
    createdBy: string,
    expiresInHours?: number
  ): QuestionSet {
    const id = 'qs_' + Math.random().toString(36).substr(2, 9)
    const token = this.generateToken()
    
    const questionSet: QuestionSet = {
      id,
      token,
      title,
      questions: questions.map((q, index) => ({
        id: `q_${index}_${Math.random().toString(36).substr(2, 6)}`,
        text: q.text,
        order: q.order
      })),
      createdBy,
      createdAt: Date.now(),
      expiresAt: expiresInHours ? Date.now() + (expiresInHours * 60 * 60 * 1000) : undefined,
      isActive: true
    }

    // Store in localStorage for now (in production, this would be a database)
    const existingSets = this.getAllQuestionSets()
    const updatedSets = [...existingSets, questionSet]
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(updatedSets))

    console.log('📝 Created question set:', questionSet)
    return questionSet
  }

  static getQuestionSetByToken(token: string): QuestionSet | null {
    // Check for demo token first
    if (token === 'resp_demo123') {
      return {
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
    }

    const questionSets = this.getAllQuestionSets()
    const questionSet = questionSets.find(qs => qs.token === token)
    
    if (!questionSet) {
      return null
    }

    // Check if expired
    if (questionSet.expiresAt && questionSet.expiresAt < Date.now()) {
      console.log('❌ Question set expired:', token)
      return null
    }

    if (!questionSet.isActive) {
      console.log('❌ Question set inactive:', token)
      return null
    }

    return questionSet
  }

  static getAllQuestionSets(): QuestionSet[] {
    if (typeof window === 'undefined') {
      // Server-side: return demo data for testing
      return [
        {
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
      ]
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUESTIONS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load question sets:', error)
      return []
    }
  }

  static submitResponse(
    token: string,
    responses: Array<{
      questionId: string
      question: string
      response: string
      session: TypingSession
      metrics: TypingMetrics
    }>,
    candidateInfo?: {
      email?: string
      firstName?: string
      lastName?: string
      ipAddress?: string
      userAgent?: string
    }
  ): CandidateSubmission {
    const questionSet = this.getQuestionSetByToken(token)
    if (!questionSet) {
      throw new Error('Invalid or expired question set')
    }

    const submissionId = 'sub_' + Math.random().toString(36).substr(2, 12)
    
    // Calculate overall score (average of all human likelihood scores)
    const overallScore = responses.reduce((sum, r) => sum + r.metrics.humanLikelihood, 0) / responses.length

    // Collect all flags
    const allFlags = responses.flatMap(r => r.metrics.flags)
    
    const submission: CandidateSubmission = {
      id: submissionId,
      questionSetId: questionSet.id,
      token,
      candidateEmail: candidateInfo?.email,
      candidateFirstName: candidateInfo?.firstName,
      candidateLastName: candidateInfo?.lastName,
      responses: responses.map(r => ({
        questionId: r.questionId,
        question: r.question,
        response: r.response,
        metrics: r.metrics,
        session: r.session,
        submittedAt: Date.now()
      })),
      submittedAt: Date.now(),
      ipAddress: candidateInfo?.ipAddress,
      userAgent: candidateInfo?.userAgent,
      overallScore,
      flags: allFlags
    }

    // Store submission (only on client side)
    if (typeof window !== 'undefined') {
      const existingSubmissions = this.getAllSubmissions()
      const updatedSubmissions = [...existingSubmissions, submission]
      localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(updatedSubmissions))
    }

    console.log('📤 Response submitted:', submission)
    return submission
  }

  static getAllSubmissions(): CandidateSubmission[] {
    if (typeof window === 'undefined') {
      // Server-side: return empty array (submissions are stored client-side only)
      return []
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESPONSES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load submissions:', error)
      return []
    }
  }

  static getSubmissionsByQuestionSet(questionSetId: string): CandidateSubmission[] {
    return this.getAllSubmissions().filter(sub => sub.questionSetId === questionSetId)
  }

  static getSubmissionById(submissionId: string): CandidateSubmission | null {
    const submissions = this.getAllSubmissions()
    return submissions.find(sub => sub.id === submissionId) || null
  }

  static evaluateResponse(text: string, session: TypingSession): TypingMetrics {
    // This is a simplified evaluation - in production you'd use more sophisticated AI detection
    let humanLikelihood = 85 // Start with baseline
    const flags: string[] = []

    // Text analysis
    const wordCount = text.trim().split(/\s+/).length
    const avgWordsPerMinute = wordCount / Math.max(session.totalTypingTime / 60000, 0.1)

    // Check for unnatural typing speed
    if (avgWordsPerMinute > 80) {
      humanLikelihood -= 15
      flags.push('Unusually fast typing speed')
    }

    // Check for lack of editing on longer responses
    if (wordCount > 30 && session.edits === 0 && session.backspaces === 0) {
      humanLikelihood -= 20
      flags.push('No editing on lengthy response')
    }

    // Check for suspicious pasting patterns
    const suspiciousPasting = session.pasteEvents > 0 && (session.pasteEvents / session.keystrokes.length) > 0.1
    if (suspiciousPasting) {
      humanLikelihood -= 25
      flags.push('High paste-to-keystroke ratio')
    }

    // Reward natural editing patterns
    const editRatio = (session.edits + session.backspaces) / Math.max(session.keystrokes.length, 1)
    if (editRatio > 0.05 && editRatio < 0.25) {
      humanLikelihood += 5 // Natural editing behavior
    }

    // Effort calculation
    let effortScore: 'Low' | 'Medium' | 'High' = 'Low'
    const timeMinutes = session.totalTypingTime / 60000
    
    if (timeMinutes > 2 && wordCount > 50 && session.edits > 3) {
      effortScore = 'High'
    } else if (timeMinutes > 1 || wordCount > 25 || session.edits > 1) {
      effortScore = 'Medium'
    }

    // AI signature score calculation
    let aiSignatureScore = 0
    if (session.pasteEvents > 0) aiSignatureScore += 0.3
    if (avgWordsPerMinute > 60) aiSignatureScore += 0.2
    if (session.longestPauseMs > 30000) aiSignatureScore += 0.3
    if (session.edits === 0 && wordCount > 20) aiSignatureScore += 0.2

    aiSignatureScore = Math.min(aiSignatureScore, 1.0)
    humanLikelihood = Math.max(Math.min(humanLikelihood, 100), 0)

    return {
      humanLikelihood,
      effortScore,
      aiSignatureScore,
      suspiciousPasting,
      flags
    }
  }

  static formatMetricsForDisplay(metrics: TypingMetrics) {
    const badges = []
    
    if (metrics.humanLikelihood >= 80) {
      badges.push({ text: 'Likely Human', emoji: '✅', type: 'success' })
    } else if (metrics.humanLikelihood >= 60) {
      badges.push({ text: 'Possibly Human', emoji: '⚠️', type: 'warning' })
    } else {
      badges.push({ text: 'Low Human Likelihood', emoji: '❌', type: 'danger' })
    }

    if (metrics.effortScore === 'High') {
      badges.push({ text: 'High Effort', emoji: '✍️', type: 'success' })
    } else if (metrics.effortScore === 'Medium') {
      badges.push({ text: 'Medium Effort', emoji: '📝', type: 'info' })
    } else {
      badges.push({ text: 'Low Effort', emoji: '⏱️', type: 'warning' })
    }

    if (metrics.aiSignatureScore < 0.3) {
      badges.push({ text: 'No AI Signature', emoji: '🚫', type: 'success' })
    } else if (metrics.aiSignatureScore < 0.6) {
      badges.push({ text: 'Possible AI Use', emoji: '🤖', type: 'warning' })
    } else {
      badges.push({ text: 'Strong AI Signature', emoji: '🔴', type: 'danger' })
    }

    return badges
  }
}