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

    const debugInfo = {
      customer_id: customerId,
      total_subscriptions: subscriptions.data.length,
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        current_period_start_type: typeof sub.current_period_start,
        current_period_end_type: typeof sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        created: sub.created,
        price_id: sub.items.data[0]?.price?.id,
        amount: sub.items.data[0]?.price?.unit_amount,
        currency: sub.items.data[0]?.price?.currency,
        interval: sub.items.data[0]?.price?.recurring?.interval
      }))
    }

    return res.status(200).json(debugInfo)

  } catch (error) {
    console.error('Debug subscription error:', error)
    return res.status(500).json({ 
      message: 'Failed to debug subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}