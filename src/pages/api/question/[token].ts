import { NextApiRequest, NextApiResponse } from 'next'
import { ResponsePortalManager } from '../../../lib/responsePortal'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' })
  }

  try {
    const questionSet = ResponsePortalManager.getQuestionSetByToken(token)
    
    if (!questionSet) {
      return res.status(404).json({ error: 'Question set not found or expired' })
    }

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
    console.error('Error fetching question set:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}