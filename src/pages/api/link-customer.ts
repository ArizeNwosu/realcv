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
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    console.log('🔍 Searching for customer with email:', email)

    // Search for customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return res.status(404).json({ message: 'No Stripe customer found with this email' })
    }

    const customer = customers.data[0]
    console.log('✅ Found customer:', customer.id)

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    })

    return res.status(200).json({
      customer_id: customer.id,
      email: customer.email,
      has_active_subscription: subscriptions.data.length > 0,
      subscription: subscriptions.data[0] || null
    })

  } catch (error) {
    console.error('Error linking customer:', error)
    return res.status(500).json({ 
      message: 'Failed to link customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}