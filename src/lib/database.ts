import { supabase, createSupabaseAdmin } from './supabase'
import { QuestionSet, CandidateSubmission, Question, TypingSession, TypingMetrics } from './responsePortal'

// Database Types
export interface QuestionSetDB {
  id: string
  token: string
  title: string
  questions: Question[]
  employer_id: string  // References auth.users.id
  created_by_email: string
  created_at: string
  expires_at?: string
  is_active: boolean
}

export interface SubmissionDB {
  id: string
  question_set_id: string
  employer_id: string  // References auth.users.id for easy filtering
  token: string
  candidate_email?: string
  candidate_first_name?: string
  candidate_last_name?: string
  responses: any[]
  submitted_at: string
  ip_address?: string
  user_agent?: string
  overall_score: number
  flags: string[]
}

export class DatabaseManager {
  static async createQuestionSet(
    title: string,
    questions: Omit<Question, 'id'>[],
    employerId: string,
    createdByEmail: string,
    expiresInHours?: number
  ): Promise<QuestionSet> {
    const supabaseAdmin = createSupabaseAdmin()
    
    const id = 'qs_' + Math.random().toString(36).substr(2, 9)
    const token = 'resp_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36)
    
    const questionSet: QuestionSetDB = {
      id,
      token,
      title,
      questions: questions.map((q, index) => ({
        id: `q_${index}_${Math.random().toString(36).substr(2, 6)}`,
        text: q.text,
        order: q.order
      })),
      employer_id: employerId,
      created_by_email: createdByEmail,
      created_at: new Date().toISOString(),
      expires_at: expiresInHours ? new Date(Date.now() + (expiresInHours * 60 * 60 * 1000)).toISOString() : undefined,
      is_active: true
    }

    console.log('Attempting to insert question set:', questionSet)
    
    const { data, error } = await supabaseAdmin
      .from('question_sets')
      .insert([questionSet])
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating question set:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Failed to create question set: ${error.message} (Code: ${error.code})`)
    }

    console.log('Question set inserted successfully:', data)

    return this.dbToQuestionSet(data)
  }

  static async getQuestionSetByToken(token: string): Promise<QuestionSet | null> {
    const { data, error } = await supabase
      .from('question_sets')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.log('Question set not found:', token)
      return null
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log('Question set expired:', token)
      return null
    }

    return this.dbToQuestionSet(data)
  }

  static async getAllQuestionSets(): Promise<QuestionSet[]> {
    const { data, error } = await supabase
      .from('question_sets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching question sets:', error)
      return []
    }

    return data.map(this.dbToQuestionSet)
  }

  static async getQuestionSetsByEmployer(employerId: string): Promise<QuestionSet[]> {
    const { data, error } = await supabase
      .from('question_sets')
      .select('*')
      .eq('employer_id', employerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching employer question sets:', error)
      return []
    }

    return data.map(this.dbToQuestionSet)
  }

  static async submitResponse(
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
  ): Promise<CandidateSubmission> {
    const supabaseAdmin = createSupabaseAdmin()
    
    // Get question set
    const questionSet = await this.getQuestionSetByToken(token)
    if (!questionSet) {
      throw new Error('Invalid or expired question set')
    }

    const submissionId = 'sub_' + Math.random().toString(36).substr(2, 12)
    
    // Calculate overall score
    const overallScore = responses.reduce((sum, r) => sum + r.metrics.humanLikelihood, 0) / responses.length
    const allFlags = responses.flatMap(r => r.metrics.flags)
    
    const submission: SubmissionDB = {
      id: submissionId,
      question_set_id: questionSet.id,
      employer_id: (questionSet as any).employerId || questionSet.createdBy, // Use the employer_id from the question set
      token,
      candidate_email: candidateInfo?.email,
      candidate_first_name: candidateInfo?.firstName,
      candidate_last_name: candidateInfo?.lastName,
      responses: responses.map(r => ({
        questionId: r.questionId,
        question: r.question,
        response: r.response,
        metrics: r.metrics,
        session: r.session,
        submittedAt: new Date().toISOString()
      })),
      submitted_at: new Date().toISOString(),
      ip_address: candidateInfo?.ipAddress,
      user_agent: candidateInfo?.userAgent,
      overall_score: overallScore,
      flags: allFlags
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert([submission])
      .select()
      .single()

    if (error) {
      console.error('Error submitting response:', error)
      throw new Error(`Failed to submit response: ${error.message}`)
    }

    return this.dbToSubmission(data)
  }

  static async getAllSubmissions(): Promise<CandidateSubmission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return []
    }

    return data.map(this.dbToSubmission)
  }

  static async getSubmissionsByEmployer(employerId: string): Promise<CandidateSubmission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('employer_id', employerId)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching employer submissions:', error)
      return []
    }

    return data.map(this.dbToSubmission)
  }

  static async getSubmissionById(submissionId: string): Promise<CandidateSubmission | null> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (error || !data) {
      return null
    }

    return this.dbToSubmission(data)
  }

  // Conversion helpers
  private static dbToQuestionSet(data: QuestionSetDB): QuestionSet {
    return {
      id: data.id,
      token: data.token,
      title: data.title,
      questions: data.questions,
      createdBy: data.created_by_email,
      createdAt: new Date(data.created_at).getTime(),
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
      isActive: data.is_active,
      employerId: data.employer_id
    } as QuestionSet & { employerId: string }
  }

  private static dbToSubmission(data: SubmissionDB): CandidateSubmission {
    return {
      id: data.id,
      questionSetId: data.question_set_id,
      token: data.token,
      candidateEmail: data.candidate_email,
      candidateFirstName: data.candidate_first_name,
      candidateLastName: data.candidate_last_name,
      responses: data.responses,
      submittedAt: new Date(data.submitted_at).getTime(),
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      overallScore: data.overall_score,
      flags: data.flags
    }
  }
}

// SQL to create tables (run this in Supabase SQL editor):
export const CREATE_TABLES_SQL = `
-- Create question_sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  question_set_id TEXT NOT NULL,
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  candidate_email TEXT,
  candidate_first_name TEXT,
  candidate_last_name TEXT,
  responses JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  overall_score NUMERIC NOT NULL,
  flags TEXT[] DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_question_sets_token ON question_sets(token);
CREATE INDEX IF NOT EXISTS idx_question_sets_employer ON question_sets(employer_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_active ON question_sets(is_active);
CREATE INDEX IF NOT EXISTS idx_submissions_token ON submissions(token);
CREATE INDEX IF NOT EXISTS idx_submissions_employer ON submissions(employer_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question_set_id ON submissions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(candidate_email);

-- Enable RLS
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for employer access control
CREATE POLICY "Employers can view their own question sets" ON question_sets 
  FOR SELECT USING (auth.uid() = employer_id);

CREATE POLICY "Employers can create question sets" ON question_sets 
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own question sets" ON question_sets 
  FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Public can view active question sets by token" ON question_sets 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Employers can view their submissions" ON submissions 
  FOR SELECT USING (auth.uid() = employer_id);

CREATE POLICY "Anyone can insert submissions" ON submissions 
  FOR INSERT WITH CHECK (true);

-- Allow public read access for candidates responding to questions
CREATE POLICY "Public can read question sets by token" ON question_sets 
  FOR SELECT USING (true);
`;