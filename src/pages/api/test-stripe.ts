import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('🔧 Testing Stripe configuration...')
    
    // Check environment variables
    const secretKey = process.env.STRIPE_SECRET_KEY!
    console.log('🔑 Secret key:', secretKey ? `${secretKey.substring(0, 7)}...` : 'Not found')
    
    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil'
    })
    
    // Test basic Stripe connection
    console.log('📞 Testing Stripe connection...')
    const prices = await stripe.prices.list({ limit: 1 })
    console.log('✅ Stripe connection successful')
    
    // Test the specific price
    console.log('💰 Testing price retrieval...')
    const price = await stripe.prices.retrieve('price_1RlOB0Av3wDYpeRLJuzDvg9r')
    console.log('✅ Price found:', price.id, price.unit_amount, price.currency)
    
    res.status(200).json({
      success: true,
      stripeConnected: true,
      priceId: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval
    })
    
  } catch (error) {
    console.error('❌ Stripe test failed:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      type: error.type || 'unknown'
    })
  }
}