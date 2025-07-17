import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { SubscriptionManager } from '../lib/subscription'

export default function Success() {
  const router = useRouter()
  const { session_id, demo } = router.query
  const [subscription, setSubscription] = useState(SubscriptionManager.getSubscriptionStatus())

  useEffect(() => {
    // Handle successful Stripe payment
    if (session_id && !subscription.isActive) {
      // Activate subscription after successful payment
      SubscriptionManager.activateSubscription()
      setSubscription(SubscriptionManager.getSubscriptionStatus())
      console.log('✅ Subscription activated for session:', session_id)
    }
    
    // Handle demo mode (for testing)
    if (demo === 'true' && !subscription.isActive) {
      SubscriptionManager.activateSubscription('demo_customer', 'demo_subscription')
      setSubscription(SubscriptionManager.getSubscriptionStatus())
    }
  }, [session_id, demo, subscription.isActive])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to RealCV Pro!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your subscription is now active. You can now export verified PDFs with human authentication certificates.
        </p>

        {/* Subscription Details */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-green-800">
            <div className="font-semibold">Plan: RealCV Pro</div>
            <div>Status: Active</div>
            {subscription.daysRemaining && (
              <div>Next billing: {subscription.daysRemaining} days</div>
            )}
          </div>
        </div>

        {/* What's Included */}
        <div className="text-left mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              PDF export with verification certificate
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              QR codes for instant verification
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Public verification pages
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Human authenticity proof
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href="/editor"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium block"
          >
            Start Creating Verified Resumes
          </a>
          
          <a
            href="/dashboard"
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium block"
          >
            View My Resumes
          </a>
        </div>

        {/* Support */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <p>
            Need help? Contact support or visit our help center.
          </p>
          <div className="mt-2">
            <a href="/" className="text-blue-600 hover:text-blue-700">
              Back to Home
            </a>
          </div>
        </div>

        {session_id && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800">
              <strong>Payment Successful:</strong> Session ID {session_id}
            </div>
          </div>
        )}
        
        {demo === 'true' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-xs text-yellow-800">
              <strong>Demo Mode:</strong> This is a demonstration of the subscription flow.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}