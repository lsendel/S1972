import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { api } from "@/api/config"

import type { ApiError } from "@/api/generated"

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setError('Invalid verification link')
        return
      }

      try {
        await api.auth.authEmailVerifyCreate({ requestBody: { token } })
        setStatus('success')
        // Redirect to onboarding after 2 seconds
        setTimeout(() => {
          navigate('/onboarding')
        }, 2000)
      } catch (err) {
        setStatus('error')
        const apiError = err as ApiError
        const body = apiError.body as { error?: string }
        setError(body?.error ?? 'Failed to verify email. The link may have expired.')
      }
    }

    void verifyEmail()
  }, [token, navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Verifying your email...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Email Verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified. Redirecting to onboarding...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6 space-y-3">
              <Button asChild className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
              <p className="text-sm text-gray-500">
                Need a new link?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                  Request verification email
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
