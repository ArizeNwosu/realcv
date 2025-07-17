export interface WritingSession {
  startTime: number
  totalTypingTime: number
  editCount: number
  pasteEvents: Array<{
    timestamp: number
    textLength: number
  }>
  keystrokes: number
  lastActivity: number
  wordCount: number
}

export class ResumeTracker {
  private session: WritingSession
  private typingTimer: NodeJS.Timeout | null = null
  private inactivityTimer: NodeJS.Timeout | null = null
  private isTyping = false
  private readonly sessionKey = 'realcv_session'

  constructor(startFresh: boolean = false) {
    if (startFresh) {
      // Start completely fresh - ignore any saved session
      console.log('✨ Starting fresh analytics session')
      this.clearSession()
      this.session = this.createFreshSession()
    } else {
      // Load existing session from localStorage if available
      const savedSession = this.loadSession()
      this.session = savedSession || this.createFreshSession()
      if (savedSession) {
        console.log('📄 Loaded existing analytics session')
      } else {
        console.log('🆕 Created new analytics session')
      }
    }
  }

  private createFreshSession(): WritingSession {
    return {
      startTime: Date.now(),
      totalTypingTime: 0,
      editCount: 0,
      pasteEvents: [],
      keystrokes: 0,
      lastActivity: Date.now(),
      wordCount: 0
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.sessionKey)
      console.log('🧹 Cleared analytics session data')
    }
    this.session = this.createFreshSession()
  }

  private loadSession(): WritingSession | null {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(this.sessionKey)
      if (saved) {
        const session = JSON.parse(saved)
        // Migration: add wordCount if it doesn't exist
        if (typeof session.wordCount === 'undefined') {
          session.wordCount = 0
        }
        return session
      }
      return null
    } catch {
      return null
    }
  }

  private saveSession(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(this.session))
    } catch {
      // Ignore localStorage errors
    }
  }

  startTyping() {
    if (!this.isTyping) {
      this.isTyping = true
      console.log('⏰ Started typing timer')
      this.typingTimer = setInterval(() => {
        this.session.totalTypingTime += 1000 // Add 1 second
        console.log('⏱️ Typing time:', Math.round(this.session.totalTypingTime / 60000), 'minutes')
        this.saveSession()
      }, 1000)
    }
    this.session.lastActivity = Date.now()
  }

  stopTyping() {
    if (this.isTyping && this.typingTimer) {
      this.isTyping = false
      console.log('⏹️ Stopped typing timer')
      clearInterval(this.typingTimer)
      this.typingTimer = null
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }
  }

  recordKeystroke() {
    this.session.keystrokes++
    console.log('⌨️ Keystroke recorded. Total:', this.session.keystrokes)
    this.startTyping()
    this.saveSession()
    
    // Stop typing after 2 seconds of inactivity
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
    this.inactivityTimer = setTimeout(() => this.stopTyping(), 2000)
  }

  recordEdit() {
    this.session.editCount++
    this.session.lastActivity = Date.now()
    this.saveSession()
  }

  recordPaste(textLength: number) {
    this.session.pasteEvents.push({
      timestamp: Date.now(),
      textLength
    })
    this.session.lastActivity = Date.now()
    this.saveSession()
  }

  updateWordCount(wordCount: number) {
    this.session.wordCount = wordCount
    this.session.lastActivity = Date.now()
    this.saveSession()
  }

  getSession(): WritingSession {
    return { ...this.session }
  }

  getSessionSummary() {
    const totalMinutes = Math.round(this.session.totalTypingTime / 60000)
    const largePastes = this.session.pasteEvents.filter(p => p.textLength > 100).length
    const smallPastes = this.session.pasteEvents.filter(p => p.textLength <= 100).length
    
    return {
      typingTimeMinutes: totalMinutes,
      editCount: this.session.editCount,
      totalPastes: this.session.pasteEvents.length,
      largePastes,
      smallPastes,
      keystrokes: this.session.keystrokes,
      wordCount: this.session.wordCount,
      sessionDuration: Math.round((Date.now() - this.session.startTime) / 60000)
    }
  }

  getTrustTier() {
    const summary = this.getSessionSummary()
    
    if (summary.typingTimeMinutes >= 15 && summary.editCount >= 3 && summary.largePastes === 0) {
      return { tier: 3, label: "High Trust - Verified Human" }
    } else if (summary.typingTimeMinutes >= 5 && summary.editCount >= 2) {
      return { tier: 2, label: "Medium Trust - Process-Based Proof" }
    } else {
      return { tier: 1, label: "Basic Trust - Limited Evidence" }
    }
  }
}