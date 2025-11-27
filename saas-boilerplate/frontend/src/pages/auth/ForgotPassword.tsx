import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import client from "@/api/client"

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: any) => {
    try {
      setError(null)
      await client.post('/auth/password/reset/', data)
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.error || "Failed to send reset email")
    }
  }

  if (submitted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Check Your Email
            </h2>
            <p className="mt-4 text-sm text-gray-600">
              If an account exists with that email, you will receive password reset instructions.
            </p>
          </div>
          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/90">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
              type="email"
              placeholder="Email address"
              autoComplete="email"
            />
            {errors.email && (
              <span className="text-sm text-red-500">Please enter a valid email</span>
            )}
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>

          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-primary hover:text-primary/90">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
