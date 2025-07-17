import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil'
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('📝 Request body:', req.body)
    const { userId } = req.body || {}

    // Allow anonymous users to subscribe - generate a session ID if no userId
    const sessionUserId = userId || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('👤 Creating checkout session for user:', sessionUserId)
    console.log('🔑 Stripe key status:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing')
    
    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      throw new Error('Invalid Stripe secret key format')
    }

    // Create minimal Stripe checkout session first
    const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://www.realcv.app')
    console.log('🌐 Using origin:', origin)
    
    // Get price ID from environment or use hardcoded fallback
    const priceId = process.env.STRIPE_PRICE_ID || 'price_1RlOB0Av3wDYpeRLJuzDvg9r'
    console.log('💰 Using price ID:', priceId)
    
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription' as const,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        userId: sessionUserId,
        source: 'realcv_pricing_page'
      },
      client_reference_id: sessionUserId,
      allow_promotion_codes: true
    }
    
    console.log('🛠️ Creating session with config:', sessionConfig)
    
    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('✅ Checkout session created:', session.id)
    res.status(200).json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('❌ Checkout session creation failed:', error)
    console.error('Error details:', error.message, error.stack)
    res.status(500).json({ 
      message: 'Failed to create checkout session',
      error: error.message
    })
  }
}