import { ResumeSection } from './resumeTemplate'
import { WritingSession } from './tracking'

export interface SavedResume {
  id: string
  title: string
  sections: ResumeSection[]
  session: WritingSession
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'realcv_resumes'
const CURRENT_RESUME_KEY = 'realcv_current'

export class ResumeStorage {
  static generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  static saveResume(title: string, sections: ResumeSection[], session: WritingSession): string {
    const resumeId = this.generateId()
    const resume: SavedResume = {
      id: resumeId,
      title,
      sections,
      session,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const existing = this.getAllResumes()
    existing.push(resume)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    localStorage.setItem(CURRENT_RESUME_KEY, resumeId)
    
    return resumeId
  }

  static updateResume(id: string, sections: ResumeSection[], session: WritingSession): void {
    const existing = this.getAllResumes()
    const index = existing.findIndex(r => r.id === id)
    
    if (index !== -1) {
      existing[index].sections = sections
      existing[index].session = session
      existing[index].updatedAt = Date.now()
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    }
  }

  static getResume(id: string): SavedResume | null {
    const resumes = this.getAllResumes()
    return resumes.find(r => r.id === id) || null
  }

  static getAllResumes(): SavedResume[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static getCurrentResumeId(): string | null {
    return localStorage.getItem(CURRENT_RESUME_KEY)
  }

  static deleteResume(id: string): void {
    const existing = this.getAllResumes()
    const filtered = existing.filter(r => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    
    if (this.getCurrentResumeId() === id) {
      localStorage.removeItem(CURRENT_RESUME_KEY)
    }
  }

  static exportResumeData(id: string): string {
    const resume = this.getResume(id)
    if (!resume) throw new Error('Resume not found')
    
    return JSON.stringify(resume, null, 2)
  }

  static importResumeData(jsonData: string): string {
    try {
      const resume = JSON.parse(jsonData) as SavedResume
      resume.id = this.generateId() // Generate new ID to avoid conflicts
      resume.createdAt = Date.now()
      resume.updatedAt = Date.now()
      
      const existing = this.getAllResumes()
      existing.push(resume)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      
      return resume.id
    } catch (error) {
      throw new Error('Invalid resume data format')
    }
  }
}