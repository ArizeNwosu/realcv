import { NextApiRequest, NextApiResponse } from 'next'
import { DatabaseManager } from '../../../lib/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' })
  }

  try {
    console.log('🔍 API: Looking for question set with token:', token)
    const questionSet = await DatabaseManager.getQuestionSetByToken(token)
    
    if (!questionSet) {
      console.log('❌ API: Question set not found:', token)
      return res.status(404).json({ error: 'Question set not found or expired' })
    }

    console.log('✅ API: Found question set:', questionSet.title)
    // Return only the necessary data for the candidate
    const response = {
      id: questionSet.id,
      token: questionSet.token,
      title: questionSet.title,
      questions: questionSet.questions.sort((a, b) => a.order - b.order),
      isActive: questionSet.isActive
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('❌ API: Error fetching question set:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}