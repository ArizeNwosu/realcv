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
    const { customerId, limit = 10, startingAfter } = req.query

    console.log('🔍 Fetching billing history for customer:', customerId)

    if (!customerId || typeof customerId !== 'string') {
      console.log('❌ Invalid customer ID')
      return res.status(400).json({ message: 'Customer ID is required' })
    }

    // Validate customer exists first
    try {
      const customer = await stripe.customers.retrieve(customerId)
      console.log('✅ Customer found:', customer.id, (customer as any).email)
    } catch (customerError) {
      console.error('❌ Customer not found:', customerError)
      return res.status(404).json({ message: 'Customer not found' })
    }

    // Get customer's payment intents (completed payments)
    console.log('🔄 Fetching payment intents...')
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: parseInt(limit as string),
      starting_after: startingAfter as string || undefined
    })
    console.log('📊 Payment intents found:', paymentIntents.data.length)

    // Get customer's invoices
    console.log('🔄 Fetching invoices...')
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: parseInt(limit as string),
      starting_after: startingAfter as string || undefined
    })
    console.log('📋 Invoices found:', invoices.data.length)

    // Get customer's subscriptions for current status
    console.log('🔄 Fetching subscriptions...')
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 5
    })
    console.log('📝 Subscriptions found:', subscriptions.data.length)

    // Process payment history
    const paymentHistory = [
      // Add invoices
      ...invoices.data.map(invoice => ({
        id: invoice.id,
        type: 'invoice',
        date: invoice.created,
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        description: invoice.description || `Invoice ${invoice.number}`,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        subscription_id: (invoice as any).subscription
      })),
      // Add standalone payments (with safe access to charges)
      ...paymentIntents.data.map(payment => ({
        id: payment.id,
        type: 'payment',
        date: payment.created,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description || 'Payment',
        receipt_url: payment.charges?.data?.[0]?.receipt_url || null
      }))
    ]

    // Sort by date (newest first)
    paymentHistory.sort((a, b) => b.date - a.date)
    console.log('📈 Payment history processed:', paymentHistory.length, 'items')

    // Get current subscription info
    const activeSubscription = subscriptions.data.find(sub => sub.status === 'active')
    const currentSubscription = activeSubscription ? {
      id: activeSubscription.id,
      status: activeSubscription.status,
      current_period_start: activeSubscription.current_period_start,
      current_period_end: activeSubscription.current_period_end,
      cancel_at_period_end: activeSubscription.cancel_at_period_end,
      plan: activeSubscription.items.data[0]?.price?.id === 'price_1RlOB0Av3wDYpeRLJuzDvg9r' ? 'pro' : 'free',
      amount: activeSubscription.items.data[0]?.price?.unit_amount || 0,
      currency: activeSubscription.items.data[0]?.price?.currency || 'usd',
      interval: activeSubscription.items.data[0]?.price?.recurring?.interval || 'month'
    } : null

    console.log('📊 Current subscription:', currentSubscription ? currentSubscription.id : 'none')
    console.log('🔍 Current subscription details:', currentSubscription)
    if (currentSubscription) {
      console.log('📅 Period start:', currentSubscription.current_period_start, 'type:', typeof currentSubscription.current_period_start)
      console.log('📅 Period end:', currentSubscription.current_period_end, 'type:', typeof currentSubscription.current_period_end)
    }

    const response = {
      payments: paymentHistory,
      current_subscription: currentSubscription,
      has_more: invoices.has_more || paymentIntents.has_more
    }

    console.log('✅ Billing history response prepared successfully')
    return res.status(200).json(response)

  } catch (error) {
    console.error('Error fetching billing history:', error)
    return res.status(500).json({ 
      message: 'Failed to fetch billing history',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}