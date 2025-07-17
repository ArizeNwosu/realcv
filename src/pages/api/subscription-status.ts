import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil'
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { customerId } = req.query

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ message: 'Customer ID is required' })
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    })

    // Get current active subscription
    const activeSubscription = subscriptions.data.find(sub => sub.status === 'active')

    console.log('🔍 Active subscription found:', activeSubscription ? 'Yes' : 'No')
    if (activeSubscription) {
      console.log('📅 Stripe subscription dates:', {
        current_period_start: activeSubscription.current_period_start,
        current_period_end: activeSubscription.current_period_end,
        start_type: typeof activeSubscription.current_period_start,
        end_type: typeof activeSubscription.current_period_end
      })
    }

    if (!activeSubscription) {
      return res.status(200).json({
        subscription: null,
        status: 'inactive',
        plan: 'free'
      })
    }

    // Get the price details
    const price = activeSubscription.items.data[0]?.price

    return res.status(200).json({
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        current_period_start: activeSubscription.current_period_start,
        current_period_end: activeSubscription.current_period_end,
        cancel_at_period_end: activeSubscription.cancel_at_period_end,
        canceled_at: activeSubscription.canceled_at,
        price: {
          id: price?.id,
          amount: price?.unit_amount,
          currency: price?.currency,
          interval: price?.recurring?.interval,
          interval_count: price?.recurring?.interval_count
        }
      },
      status: activeSubscription.status,
      plan: price?.id === 'price_1RlOB0Av3wDYpeRLJuzDvg9r' ? 'pro' : 'free'
    })

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return res.status(500).json({ 
      message: 'Failed to fetch subscription status',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}