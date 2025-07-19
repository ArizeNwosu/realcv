import { useState, useRef, useCallback, useEffect } from 'react'

export interface KeystrokeEvent {
  timestamp: number
  type: 'keydown' | 'keyup' | 'paste' | 'backspace' | 'delete' | 'edit'
  key?: string
  textLength: number
  cursorPosition?: number
}

export interface TypingSession {
  questionId: string
  startTime: number
  endTime?: number
  keystrokes: KeystrokeEvent[]
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

export function useTypingTelemetry(questionId: string) {
  const [isTracking, setIsTracking] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const sessionRef = useRef<TypingSession>({
    questionId,
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
  })
  
  const previousTextRef = useRef('')
  const lastKeystrokeRef = useRef(0)

  // Track tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTracking) {
        setTabSwitches(prev => {
          const newCount = prev + 1
          sessionRef.current.tabSwitches = newCount
          
          // Log tab switch event
          sessionRef.current.keystrokes.push({
            timestamp: Date.now(),
            type: 'edit',
            key: 'TAB_SWITCH',
            textLength: sessionRef.current.textLength
          })
          
          return newCount
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isTracking])

  const startTracking = useCallback(() => {
    sessionRef.current = {
      questionId,
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
      textLength: 0,
      finalText: ''
    }
    setIsTracking(true)
    console.log('🎯 Typing telemetry started for question:', questionId)
  }, [questionId])

  const stopTracking = useCallback((finalText: string) => {
    setIsTracking(false)
    sessionRef.current.endTime = Date.now()
    sessionRef.current.finalText = finalText
    sessionRef.current.textLength = finalText.length
    
    // Calculate metrics
    calculateMetrics()
    
    console.log('⏹️ Typing telemetry stopped. Session:', sessionRef.current)
    return sessionRef.current
  }, [])

  const calculateMetrics = useCallback(() => {
    const session = sessionRef.current
    const keystrokes = session.keystrokes
    
    if (keystrokes.length < 2) return

    // Calculate total typing time and pauses
    const pauses: number[] = []
    for (let i = 1; i < keystrokes.length; i++) {
      const pause = keystrokes[i].timestamp - keystrokes[i - 1].timestamp
      if (pause > 50) { // Only count pauses > 50ms as meaningful
        pauses.push(pause)
      }
    }

    session.totalTypingTime = session.endTime ? session.endTime - session.startTime : 0
    session.averagePauseMs = pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0
    session.longestPauseMs = pauses.length > 0 ? Math.max(...pauses) : 0
  }, [])

  const recordKeystroke = useCallback((event: KeyboardEvent, currentText: string, cursorPosition?: number) => {
    if (!isTracking) return

    const now = Date.now()
    const keystroke: KeystrokeEvent = {
      timestamp: now,
      type: 'keydown',
      key: event.key,
      textLength: currentText.length,
      cursorPosition
    }

    // Categorize the keystroke
    if (event.key === 'Backspace') {
      keystroke.type = 'backspace'
      sessionRef.current.backspaces++
    } else if (event.key === 'Delete') {
      keystroke.type = 'delete'
      sessionRef.current.deletions++
    }

    // Detect edits (text changes that aren't just additions)
    const previousText = previousTextRef.current
    if (previousText.length > 0 && currentText.length < previousText.length) {
      sessionRef.current.edits++
      keystroke.type = 'edit'
    }

    sessionRef.current.keystrokes.push(keystroke)
    previousTextRef.current = currentText
    lastKeystrokeRef.current = now
  }, [isTracking])

  const recordPaste = useCallback((pastedText: string, currentText: string) => {
    if (!isTracking) return

    sessionRef.current.pasteEvents++
    sessionRef.current.keystrokes.push({
      timestamp: Date.now(),
      type: 'paste',
      key: `PASTE_${pastedText.length}_CHARS`,
      textLength: currentText.length
    })

    console.log('📋 Paste detected:', pastedText.length, 'characters')
  }, [isTracking])

  const getSession = useCallback(() => {
    return { ...sessionRef.current }
  }, [])

  const generateMetrics = useCallback((): TypingMetrics => {
    const session = sessionRef.current
    
    // Calculate human likelihood score
    let humanLikelihood = 100
    const flags: string[] = []

    // Penalize for suspicious pasting
    const suspiciousPasting = session.pasteEvents > 0 && session.pasteEvents > session.keystrokes.length * 0.1
    if (suspiciousPasting) {
      humanLikelihood -= 30
      flags.push('Excessive pasting detected')
    }

    // Penalize for too few keystrokes relative to text length
    const keystrokeRatio = session.keystrokes.length / Math.max(session.textLength, 1)
    if (keystrokeRatio < 1.5) {
      humanLikelihood -= 20
      flags.push('Low keystroke-to-text ratio')
    }

    // Penalize for very long pauses (possible AI generation time)
    if (session.longestPauseMs > 30000) { // 30 seconds
      humanLikelihood -= 25
      flags.push('Unusually long pause detected')
    }

    // Reward for normal editing behavior
    const editRatio = (session.edits + session.backspaces) / Math.max(session.keystrokes.length, 1)
    if (editRatio > 0.05 && editRatio < 0.3) {
      humanLikelihood += 10 // Normal editing behavior
    }

    // Penalize for tab switching during typing
    if (session.tabSwitches > 2) {
      humanLikelihood -= 15
      flags.push('Multiple tab switches during typing')
    }

    // Determine effort score based on time and editing
    let effortScore: 'Low' | 'Medium' | 'High' = 'Low'
    const timeMinutes = session.totalTypingTime / 60000
    
    if (timeMinutes > 3 && session.edits > 5) {
      effortScore = 'High'
    } else if (timeMinutes > 1 || session.edits > 2) {
      effortScore = 'Medium'
    }

    // Simple AI signature score (lower is better)
    let aiSignatureScore = 0
    if (session.pasteEvents > 0) aiSignatureScore += 0.3
    if (session.averagePauseMs < 100) aiSignatureScore += 0.2 // Too fast typing
    if (session.edits === 0 && session.textLength > 50) aiSignatureScore += 0.3 // No edits on long text
    if (session.longestPauseMs > 20000) aiSignatureScore += 0.4 // Long pause suggests external generation

    aiSignatureScore = Math.min(aiSignatureScore, 1.0)
    humanLikelihood = Math.max(humanLikelihood, 0)

    return {
      humanLikelihood,
      effortScore,
      aiSignatureScore,
      suspiciousPasting,
      flags
    }
  }, [])

  return {
    isTracking,
    tabSwitches,
    startTracking,
    stopTracking,
    recordKeystroke,
    recordPaste,
    getSession,
    generateMetrics
  }
}

export default useTypingTelemetry