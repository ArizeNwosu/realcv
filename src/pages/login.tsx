import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/router'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isEmployerSignup, setIsEmployerSignup] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  useEffect(() => {
    // Check if user came from "Get Started" button
    if (router.query.signup === 'true' || router.asPath.includes('signup')) {
      setIsSignUp(true)
    }
    // Check if user wants employer signup
    if (router.query.employer === 'true') {
      setIsSignUp(true)
      setIsEmployerSignup(true)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        // Validate signup fields
        if (!firstName.trim()) {
          setError('First name is required')
          return
        }
        if (!lastName.trim()) {
          setError('Last name is required')
          return
        }
        if (isEmployerSignup && !companyName.trim()) {
          setError('Company name is required')
          return
        }
        if (isEmployerSignup && !jobTitle.trim()) {
          setError('Job title is required')
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long')
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`,
              first_name: firstName,
              last_name: lastName,
              ...(isEmployerSignup && {
                company_name: companyName,
                job_title: jobTitle,
                user_type: 'employer'
              })
            },
            emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL 
              ? `${process.env.NEXT_PUBLIC_SITE_URL}${isEmployerSignup ? '/recruiter-dashboard' : '/dashboard'}`
              : process.env.NODE_ENV === 'production'
                ? `https://www.realcv.app${isEmployerSignup ? '/recruiter-dashboard' : '/dashboard'}`
                : `${window.location.origin}${isEmployerSignup ? '/recruiter-dashboard' : '/dashboard'}`
          }
        })
        
        if (error) {
          // Handle specific error for already registered email
          if (error.message.includes('User already registered') || 
              error.message.includes('already registered') ||
              error.message.includes('already exists') ||
              error.message.includes('already been registered') ||
              error.message.includes('email address is already registered')) {
            throw new Error('This email already exists. Log in instead.')
          }
          throw error
        }
        
        setSuccess('Please check your email to confirm your signup!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // Check if user is an employer based on their metadata
        const userType = data.user?.user_metadata?.user_type
        const redirectUrl = router.query.redirect as string
        
        if (redirectUrl) {
          // If there's a redirect URL, use it
          window.location.href = redirectUrl
        } else if (userType === 'employer') {
          // Employer users go to recruiter dashboard
          window.location.href = '/recruiter-dashboard'
        } else {
          // Job seekers go to profile/dashboard
          window.location.href = '/profile'
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {isSignUp ? (isEmployerSignup ? 'Create Employer Account' : 'Create Account') : 'Sign In'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {isSignUp ? (isEmployerSignup ? 'Create your employer account to start screening candidates with AI-resistant questions' : 'Sign up for your RealCV account') : 'Welcome back to RealCV'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                minLength={6}
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  minLength={6}
                  required
                />
              </div>
            )}

            {isSignUp && isEmployerSignup && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your company name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your job title"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Please wait...' : (isSignUp ? (isEmployerSignup ? 'Create Employer Account' : 'Sign Up') : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setIsEmployerSignup(false)
                setError(null)
                setSuccess(null)
                setEmail('')
                setPassword('')
                setConfirmPassword('')
                setFirstName('')
                setLastName('')
                setCompanyName('')
                setJobTitle('')
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : 'Don\'t have an account? Sign up'
              }
            </button>
          </div>

          <div className="mt-4 text-center space-y-2">
            <div>
              <Link 
                href="/login?signup=true&employer=true" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Are you hiring? Create Employer Account →
              </Link>
            </div>
            <div>
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}