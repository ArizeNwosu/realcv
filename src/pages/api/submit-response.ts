import { NextApiRequest, NextApiResponse } from 'next'
import { DatabaseManager } from '../../lib/database'
import { ResponsePortalManager, TypingSession } from '../../lib/responsePortal'

interface SubmissionRequest {
  token: string
  responses: Array<{
    questionId: string
    question: string
    response: string
    session: TypingSession
  }>
  candidateEmail?: string
  candidateFirstName?: string
  candidateLastName?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token, responses, candidateEmail, candidateFirstName, candidateLastName }: SubmissionRequest = req.body

    if (!token || !responses || !Array.isArray(responses)) {
      console.error('Validation failed:', { token: !!token, responses: !!responses, isArray: Array.isArray(responses) })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (responses.length === 0) {
      console.error('No responses provided')
      return res.status(400).json({ error: 'No responses provided' })
    }

    // Validate token exists
    const questionSet = await DatabaseManager.getQuestionSetByToken(token)
    if (!questionSet) {
      return res.status(404).json({ error: 'Invalid or expired token' })
    }

    // Process each response and generate metrics
    const processedResponses = responses.map(response => {
      // Evaluate the response using our scoring system
      const metrics = ResponsePortalManager.evaluateResponse(response.response, response.session)
      
      return {
        questionId: response.questionId,
        question: response.question,
        response: response.response,
        session: response.session,
        metrics
      }
    })

    // Get client info with better IP detection for Vercel
    const getClientIP = () => {
      const forwarded = req.headers['x-forwarded-for']
      const realIP = req.headers['x-real-ip']
      const cfConnectingIP = req.headers['cf-connecting-ip']
      
      if (forwarded) {
        // x-forwarded-for can be a comma-separated list, take the first one
        return (forwarded as string).split(',')[0].trim()
      }
      if (realIP) {
        return realIP as string
      }
      if (cfConnectingIP) {
        return cfConnectingIP as string
      }
      return req.socket?.remoteAddress || 'unknown'
    }

    const clientInfo = {
      email: candidateEmail,
      firstName: candidateFirstName,
      lastName: candidateLastName,
      ipAddress: getClientIP(),
      userAgent: req.headers['user-agent'] || 'unknown'
    }

    // Submit the response
    const submission = await DatabaseManager.submitResponse(
      token,
      processedResponses,
      clientInfo
    )

    console.log('✅ Response submission successful:', submission.id)

    // Return success response with submission data for client storage
    res.status(200).json({
      success: true,
      submissionId: submission.id,
      message: 'Response submitted successfully',
      submission: {
        id: submission.id,
        questionSetId: submission.questionSetId,
        token: submission.token,
        candidateEmail: submission.candidateEmail,
        candidateFirstName: clientInfo.firstName,
        candidateLastName: clientInfo.lastName,
        submittedAt: submission.submittedAt,
        overallScore: submission.overallScore,
        flags: submission.flags,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        responses: submission.responses
      }
    })

  } catch (error) {
    console.error('Error submitting response:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    console.error('Request body:', req.body)
    res.status(500).json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` })
  }
}