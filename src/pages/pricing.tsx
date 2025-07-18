import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { SubscriptionManager } from '../lib/subscription'
import { supabase } from '../lib/supabase'

export default function Pricing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState({
    isActive: false,
    plan: 'free',
    status: 'inactive'
  })
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      // First check local subscription
      const localSub = SubscriptionManager.getSubscriptionStatus()
      setSubscription(localSub)

      // Then check if user is authenticated and has Stripe subscription
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Try to get customer ID from multiple sources
        let customerId = localStorage.getItem('stripe_customer_id') || user.user_metadata?.stripe_customer_id
        
        if (customerId) {
          try {
            const response = await fetch(`/api/billing-history?customerId=${customerId}&limit=1`)
            const data = await response.json()
            
            if (response.ok && data.current_subscription) {
              // User has active Stripe subscription - override local status
              setSubscription({
                isActive: true,
                plan: 'pro',
                status: 'active'
              })
            }
          } catch (error) {
            console.log('Could not check Stripe subscription:', error)
            // Keep local subscription status if Stripe check fails
          }
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setCheckingSubscription(false)
    }
  }

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')

    try {
      const userId = SubscriptionManager.getCurrentUserId()

      // Create Stripe checkout session
      console.log('💳 Creating checkout session for user:', userId)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      console.log('📄 Response data:', data)

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to create checkout session'
        console.error('API Error:', errorMessage)
        throw new Error(errorMessage)
      }

      if (data.url) {
        console.log('➡️ Redirecting to Stripe checkout:', data.url)
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received from Stripe')
      }

    } catch (err) {
      console.error('Subscription failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Provide more specific error messages
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else if (errorMessage.includes('Stripe')) {
        setError('Payment system error. Please try again in a moment.')
      } else if (errorMessage.includes('key') || errorMessage.includes('configuration')) {
        setError('Service configuration error. Please contact support.')
      } else {
        setError(`Failed to start subscription: ${errorMessage}`)
      }
      
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Start free, upgrade when you need verified exports
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription.isActive && (
          <div className="mb-6 sm:mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-green-800 font-semibold text-sm sm:text-base">
                ✓ You have an active RealCV Pro subscription
              </div>
              {subscription.daysRemaining && (
                <div className="text-green-600 text-sm mt-1">
                  {subscription.daysRemaining} days remaining
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Free</h3>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">$0</div>
              <div className="text-gray-600">Forever</div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Create unlimited resumes
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real-time behavior tracking
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Professional resume templates
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Save and edit anytime
              </li>
              <li className="flex items-center text-gray-400">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                No PDF export
              </li>
              <li className="flex items-center text-gray-400">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                No verification certificate
              </li>
            </ul>

            <a
              href="/editor"
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium text-center block text-sm sm:text-base"
            >
              Start Writing Free
            </a>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-xl border-2 border-blue-500 p-6 sm:p-8 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">RealCV Pro</h3>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                $5
                <span className="text-base sm:text-lg text-gray-600">/month</span>
              </div>
              <div className="text-gray-600">Billed monthly</div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Everything in Free
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <strong>PDF export with certificate</strong>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <strong>Human verification proof</strong>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <strong>QR code verification</strong>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <strong>Public verification pages</strong>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Trust tier certification
              </li>
            </ul>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading || subscription.isActive || checkingSubscription}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium text-sm sm:text-base"
            >
              {checkingSubscription ? 'Checking subscription...' : loading ? 'Processing...' : subscription.isActive ? 'Already Subscribed' : 'Subscribe to Pro'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Why do I need human verification for my resume?
              </h4>
              <p className="text-gray-600">
                In an era of AI-generated content, employers want confidence that resumes represent authentic human work. 
                RealCV provides proof that your resume was genuinely written by you, not generated by AI tools.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                How does the verification work?
              </h4>
              <p className="text-gray-600">
                We track your writing behavior in real-time: typing patterns, edit frequency, pause duration, and paste events. 
                This creates a unique "fingerprint" that proves human authorship and generates a trust score.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You'll continue to have access to Pro features 
                until the end of your billing period.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}