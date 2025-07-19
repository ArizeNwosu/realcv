import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import PasswordInput from '../components/PasswordInput'

interface ProfileData {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  user_metadata: {
    full_name?: string
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}

interface PaymentHistory {
  id: string
  type: 'invoice' | 'payment'
  date: number
  amount: number
  currency: string
  status: string
  description: string
  invoice_pdf?: string
  hosted_invoice_url?: string
  receipt_url?: string
  subscription_id?: string
}

interface CurrentSubscription {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  plan: string
  amount: number
  currency: string
  interval: string
}

interface BillingData {
  payments: PaymentHistory[]
  current_subscription: CurrentSubscription | null
  has_more: boolean
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Billing states
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  const loadBillingData = async () => {
    setBillingLoading(true)
    setBillingError(null)
    
    try {
      // Try to get customer ID from multiple sources
      let customerId = localStorage.getItem('stripe_customer_id')
      
      // Also try to get from user metadata if not in localStorage
      if (!customerId && user) {
        customerId = user.user_metadata?.stripe_customer_id
        // If found in user metadata, save to localStorage for future use
        if (customerId) {
          localStorage.setItem('stripe_customer_id', customerId)
        }
      }
      
      console.log('🔍 Loading billing data for customer:', customerId)
      console.log('💾 LocalStorage stripe_customer_id:', localStorage.getItem('stripe_customer_id'))
      console.log('👤 User metadata stripe_customer_id:', user?.user_metadata?.stripe_customer_id)
      
      if (!customerId) {
        console.log('❌ No customer ID found')
        setBillingError('No billing information found. If you have an active subscription, try linking your account on the subscription page.')
        return
      }

      const url = `/api/billing-history?customerId=${customerId}&limit=10`
      console.log('🔄 Fetching billing history from:', url)
      
      const response = await fetch(url)
      console.log('📡 Billing API response status:', response.status)
      
      const data = await response.json()
      console.log('📄 Billing API response data:', data)
      
      if (response.ok) {
        setBillingData(data)
        console.log('✅ Billing data loaded successfully')
        console.log('📊 Full billing data response:', data)
        if (data.current_subscription) {
          console.log('💰 Current subscription details:', data.current_subscription)
          console.log('📅 Period start raw:', data.current_subscription.current_period_start, 'type:', typeof data.current_subscription.current_period_start)
          console.log('📅 Period end raw:', data.current_subscription.current_period_end, 'type:', typeof data.current_subscription.current_period_end)
        } else {
          console.log('❌ No current_subscription in response')
        }
      } else {
        console.error('❌ Billing API error:', data)
        setBillingError(data.error || data.message || 'Failed to load billing data')
      }
    } catch (error) {
      console.error('❌ Billing fetch exception:', error)
      setBillingError('Failed to load billing data')
    } finally {
      setBillingLoading(false)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to login if not authenticated
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
        return
      }

      setUser(user)
      setProfile(user as ProfileData)
      
      // Set first and last names from user metadata
      setFirstName(user.user_metadata?.first_name || '')
      setLastName(user.user_metadata?.last_name || '')
      
      // If no first/last name but has full_name, try to split it
      if (!user.user_metadata?.first_name && !user.user_metadata?.last_name && user.user_metadata?.full_name) {
        const nameParts = user.user_metadata.full_name.split(' ')
        setFirstName(nameParts[0] || '')
        setLastName(nameParts.slice(1).join(' ') || '')
      }
      
      setEmail(user.email || '')
    } catch (error) {
      console.error('Error checking user:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      
      const { error } = await supabase.auth.updateUser({
        email: email,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName
        }
      })

      if (error) throw error

      setSuccess('Profile updated successfully!')
      setEditing(false)
      
      // Refresh user data
      checkUser()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setSuccess('Password changed successfully!')
      setChangingPassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to change password')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const formatSimpleDate = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'Not available'
    }
    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime())) {
      return 'Not available'
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Profile</h1>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors text-sm sm:text-base self-start sm:self-auto"
          >
            ← Back to Dashboard
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Profile Information */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      // Reset form values
                      setFirstName(user?.user_metadata?.first_name || '')
                      setLastName(user?.user_metadata?.last_name || '')
                      setEmail(user?.email || '')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-gray-900">
                    {profile?.user_metadata?.full_name || 
                     `${profile?.user_metadata?.first_name || ''} ${profile?.user_metadata?.last_name || ''}`.trim() || 
                     'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Created</label>
                  <p className="text-gray-900">
                    {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
                  <p className="text-gray-900">
                    {profile?.last_sign_in_at ? formatDate(profile.last_sign_in_at) : 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Security</h2>
              {!changingPassword && (
                <button
                  onClick={() => setChangingPassword(true)}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {changingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPassword(false)
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <p className="text-gray-900">••••••••</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Billing */}
        <div className="mt-6 bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Billing</h2>
            <button
              onClick={loadBillingData}
              disabled={billingLoading}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {billingLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {billingError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {billingError}
            </div>
          )}

          {billingData ? (
            <div className="space-y-6">
              {/* Current Subscription Status */}
              {billingData.current_subscription && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold text-gray-800 mb-2">Current Subscription</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Plan:</span>
                      <span className="ml-2 capitalize">{billingData.current_subscription.plan}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(billingData.current_subscription.status)}`}>
                        {billingData.current_subscription.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Amount:</span>
                      <span className="ml-2">
                        {formatAmount(billingData.current_subscription.amount, billingData.current_subscription.currency)}
                        /{billingData.current_subscription.interval}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Next billing:</span>
                      <span className="ml-2">
                        {billingData.current_subscription.cancel_at_period_end 
                          ? `Ends ${formatSimpleDate(billingData.current_subscription.current_period_end)}`
                          : formatSimpleDate(billingData.current_subscription.current_period_end)
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Payment History</h3>
                {billingData.payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No payment history found</p>
                ) : (
                  <div className="space-y-3">
                    {billingData.payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-gray-900">{payment.description}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatSimpleDate(payment.date)} • {formatAmount(payment.amount, payment.currency)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {payment.invoice_pdf && (
                            <a
                              href={payment.invoice_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              PDF
                            </a>
                          )}
                          {payment.hosted_invoice_url && (
                            <a
                              href={payment.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                              View
                            </a>
                          )}
                          {payment.receipt_url && (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                              Receipt
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Load More */}
              {billingData.has_more && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      // TODO: Implement load more functionality
                      console.log('Load more payments')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Click "Refresh" to load your billing information</p>
              <button
                onClick={loadBillingData}
                disabled={billingLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {billingLoading ? 'Loading...' : 'Billing History'}
              </button>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="mt-6 bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Actions</h2>
          <div className="flex gap-4">
            <Link
              href="/subscription"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Manage Subscription
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}