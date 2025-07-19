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

    // Get customer's subscriptions with expanded data
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
      expand: ['data.default_payment_method', 'data.latest_invoice']
    })

    // Also try fetching the first subscription individually
    let detailedSubscription = null
    if (subscriptions.data.length > 0) {
      try {
        detailedSubscription = await stripe.subscriptions.retrieve(subscriptions.data[0].id)
      } catch (err) {
        console.error('Error fetching detailed subscription:', err)
      }
    }

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
        interval: sub.items.data[0]?.price?.recurring?.interval,
        all_keys: Object.keys(sub).sort(),
        has_period_start: 'current_period_start' in sub,
        has_period_end: 'current_period_end' in sub
      })),
      detailed_subscription: detailedSubscription ? {
        id: detailedSubscription.id,
        status: detailedSubscription.status,
        current_period_start: detailedSubscription.current_period_start,
        current_period_end: detailedSubscription.current_period_end,
        current_period_start_type: typeof detailedSubscription.current_period_start,
        current_period_end_type: typeof detailedSubscription.current_period_end,
        all_keys: Object.keys(detailedSubscription).sort(),
        has_period_start: 'current_period_start' in detailedSubscription,
        has_period_end: 'current_period_end' in detailedSubscription
      } : null
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