import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil'
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { customerId } = req.body

    console.log('🔍 Creating customer portal for:', customerId)

    if (!customerId) {
      console.log('❌ No customer ID provided')
      return res.status(400).json({ message: 'Customer ID is required' })
    }

    // Validate customer exists
    try {
      const customer = await stripe.customers.retrieve(customerId)
      console.log('✅ Customer found:', customer.id, customer.email)
    } catch (customerError) {
      console.error('❌ Customer not found:', customerError)
      return res.status(404).json({ 
        message: 'Customer not found in Stripe',
        error: customerError instanceof Error ? customerError.message : 'Unknown error'
      })
    }

    const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://www.realcv.app')
    console.log('🌐 Using origin:', origin)

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/profile`
    })

    console.log('✅ Portal session created:', portalSession.id)

    return res.status(200).json({
      url: portalSession.url
    })

  } catch (error) {
    console.error('❌ Error creating customer portal session:', error)
    return res.status(500).json({ 
      message: 'Failed to create customer portal session',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}