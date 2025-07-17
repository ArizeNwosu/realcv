interface DocumentCode {
  code: string
  resumeId: string
  createdAt: number
}

const CODES_STORAGE_KEY = 'realcv_document_codes'

export class DocumentCodeManager {
  static generateCode(): string {
    // Generate a unique 12-character code like AB19F8C392XZ
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    console.log('🎲 Raw generateCode result:', code, 'Length:', code.length)
    return code
  }

  static createDocumentCode(resumeId: string): string {
    console.log('📝 Creating document code for resume ID:', resumeId)
    
    // Check if a code already exists for this resume
    const existing = this.getAllCodes()
    console.log('📋 Existing codes:', existing)
    const existingCode = existing.find(c => c.resumeId === resumeId)
    
    if (existingCode) {
      console.log('♻️ Returning existing document code:', existingCode.code)
      return existingCode.code
    }
    
    // Generate new 12-character code
    const code = this.generateCode()
    console.log('🆕 Generated raw code:', code, 'Length:', code.length)
    
    const documentCode: DocumentCode = {
      code,
      resumeId,
      createdAt: Date.now()
    }

    existing.push(documentCode)
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(existing))
    
    console.log('✅ Saved NEW 12-character document code:', code, 'for resume:', resumeId)
    return code
  }

  static getResumeIdByCode(code: string): string | null {
    const codes = this.getAllCodes()
    const found = codes.find(c => c.code === code)
    return found ? found.resumeId : null
  }

  static getAllCodes(): DocumentCode[] {
    try {
      const stored = localStorage.getItem(CODES_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static deleteCode(code: string): void {
    const existing = this.getAllCodes()
    const filtered = existing.filter(c => c.code !== code)
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(filtered))
  }

  static clearAllCodes(): void {
    localStorage.removeItem(CODES_STORAGE_KEY)
    console.log('Cleared all document codes - new ones will be 12 characters')
  }

  static migrateOldCodes(): void {
    const codes = this.getAllCodes()
    const hasOldCodes = codes.some(c => c.code.length !== 12 || c.code.includes('-'))
    if (hasOldCodes) {
      this.clearAllCodes()
      console.log('Migrated old document codes to new 12-character format')
    }
  }
}