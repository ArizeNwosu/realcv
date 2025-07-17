import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SubscriptionManager } from '../lib/subscription'
import Link from 'next/link'

interface StripeSubscription {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at: number | null
  price: {
    id: string
    amount: number
    currency: string
    interval: string
    interval_count: number
  }
}

interface SubscriptionData {
  subscription: StripeSubscription | null
  status: string
  plan: string
}

export default function Subscription() {
  const [loading, setLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [localSubscription, setLocalSubscription] = useState(SubscriptionManager.getSubscription())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Use local subscription data if not authenticated
        setLoading(false)
        return
      }

      // Try to get customer ID from multiple sources
      let customerId = localStorage.getItem('stripe_customer_id')
      
      // If no customer ID found, try to get it from user metadata
      if (!customerId) {
        customerId = user.user_metadata?.stripe_customer_id
      }
      
      console.log('🔍 Looking for customer ID:', customerId)
      console.log('📊 User metadata:', user.user_metadata)
      console.log('💾 Local storage stripe_customer_id:', localStorage.getItem('stripe_customer_id'))
      
      if (customerId) {
        console.log('🔄 Fetching subscription data for customer:', customerId)
        const response = await fetch(`/api/subscription-status?customerId=${customerId}`)
        const data = await response.json()
        
        console.log('📡 Subscription API response:', data)
        
        if (response.ok) {
          setSubscriptionData(data)
        } else {
          setError(data.message || 'Failed to load subscription data')
        }
      } else {
        console.log('⚠️ No customer ID found - using local subscription data')
        // Don't show error if user has a pro plan locally - they might have a valid subscription
        if (localSubscription.plan === 'pro') {
          setError('Your Pro subscription is active, but billing management is not connected. Try "Link My Stripe Account" below to connect your billing.')
        } else {
          setError('No subscription found. Please contact support if you have an active subscription.')
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      setError('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }


  const handleOpenCustomerPortal = async () => {
    // Try to get customer ID from multiple sources
    let customerId = localStorage.getItem('stripe_customer_id')
    
    // Also try to get from user metadata if not in localStorage
    if (!customerId) {
      const { data: { user } } = await supabase.auth.getUser()
      customerId = user?.user_metadata?.stripe_customer_id
    }
    
    console.log('🔍 Opening customer portal for customer:', customerId)
    console.log('💾 LocalStorage stripe_customer_id:', localStorage.getItem('stripe_customer_id'))
    console.log('👤 User metadata stripe_customer_id:', (await supabase.auth.getUser()).data.user?.user_metadata?.stripe_customer_id)
    
    if (!customerId) {
      setError('Customer ID not found. Please try linking your account first or contact support.')
      return
    }

    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId })
      })

      const data = await response.json()
      
      console.log('📡 Customer portal API response:', data)

      if (response.ok) {
        console.log('✅ Redirecting to customer portal:', data.url)
        window.location.href = data.url
      } else {
        console.error('❌ Customer portal error:', data)
        setError(data.error || data.message || 'Failed to open customer portal')
      }
    } catch (error) {
      console.error('❌ Customer portal exception:', error)
      setError('Failed to open customer portal')
    }
  }

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

  const handleLinkAccount = async () => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.email) {
        setError('No email found for your account')
        return
      }

      const response = await fetch('/api/link-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Save the customer ID to localStorage
        localStorage.setItem('stripe_customer_id', data.customer_id)
        
        // Update user metadata with customer ID
        await supabase.auth.updateUser({
          data: {
            stripe_customer_id: data.customer_id
          }
        })

        setSuccess('Account linked successfully! Refreshing...')
        
        // Reload the page to refresh subscription data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setError(data.message || 'Failed to link account')
      }
    } catch (error) {
      setError('Failed to link account')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'Not available'
    }
    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime())) {
      return 'Not available'
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading subscription data...</div>
        </div>
      </div>
    )
  }

  const currentSubscription = subscriptionData?.subscription || null
  const isStripeSubscription = currentSubscription !== null
  const plan = subscriptionData?.plan || localSubscription.plan
  const status = subscriptionData?.status || localSubscription.status

  // Debug logging
  console.log('🎯 Subscription page state:', {
    subscriptionData,
    currentSubscription,
    isStripeSubscription,
    plan,
    status,
    localSubscription
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Subscription Management</h1>
          <Link 
            href="/profile" 
            className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Profile
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Current Plan</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              plan === 'pro' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="text-gray-900 capitalize">{status}</p>
            </div>

            {isStripeSubscription && currentSubscription && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-gray-900">
                    {formatAmount(currentSubscription.price.amount, currentSubscription.price.currency)} 
                    / {currentSubscription.price.interval}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Period</label>
                  <p className="text-gray-900">
                    {formatDate(currentSubscription.current_period_start)} - {formatDate(currentSubscription.current_period_end)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Billing Date</label>
                  <p className="text-gray-900">
                    {currentSubscription.cancel_at_period_end 
                      ? `Canceled - ends ${formatDate(currentSubscription.current_period_end)}`
                      : formatDate(currentSubscription.current_period_end)
                    }
                  </p>
                </div>
              </>
            )}

            {!isStripeSubscription && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Features</label>
                <p className="text-gray-900">
                  {plan === 'pro' 
                    ? 'Resume publishing, PDF export, advanced features'
                    : 'Basic resume builder - upgrade to unlock publishing'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Actions */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
          
          <div className="space-y-3">
            {plan === 'free' && (
              <button
                onClick={handleUpgrade}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Upgrade to Pro - $5/month
              </button>
            )}

            {plan === 'pro' && !isStripeSubscription && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Billing Connection Issue</h4>
                  <p className="text-sm text-yellow-700">
                    Your Pro subscription is active locally, but not connected to Stripe billing. 
                    This usually happens when you subscribed through a different method or the connection was lost.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Use "Link My Stripe Account" to reconnect your billing, or contact support if you need help.
                  </p>
                </div>
                
                <button
                  onClick={handleLinkAccount}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Linking...' : 'Link My Stripe Account'}
                </button>
                
                <button
                  onClick={handleUpgrade}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Manage Subscription via Stripe
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset your local subscription? This will set your plan back to Free.')) {
                      localStorage.removeItem('realcv_subscription')
                      localStorage.removeItem('stripe_customer_id')
                      window.location.reload()
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Reset Subscription Data
                </button>
              </>
            )}

            {isStripeSubscription && currentSubscription && (
              <button
                onClick={handleOpenCustomerPortal}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Manage Billing & Subscription
              </button>
            )}
          </div>
        </div>



        {/* Plan Comparison */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Plan Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Free Plan</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Resume builder</li>
                <li>• Basic templates</li>
                <li>• Local storage</li>
                <li>• Typing tracking</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-gray-800 mb-2">Pro Plan - $5/month</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Everything in Free</li>
                <li>• Resume publishing</li>
                <li>• PDF export</li>
                <li>• QR code generation</li>
                <li>• Trust verification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}