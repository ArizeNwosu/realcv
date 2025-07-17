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
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Subscription ID is required' })
    }

    // Update subscription to cancel at period end or immediately
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd
    })

    return res.status(200).json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at,
        current_period_end: subscription.current_period_end
      },
      message: cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of the current period'
        : 'Subscription canceled immediately'
    })

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return res.status(500).json({ 
      message: 'Failed to cancel subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}