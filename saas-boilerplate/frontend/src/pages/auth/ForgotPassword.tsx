import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/api/config"
import AuthLayout from "@/components/layout/AuthLayout"
import { Loader2 } from "lucide-react"

import type { ApiError } from "@/api/generated"

interface FormData {
  email: string
}

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    try {
      setError(null)
      await api.auth.authPasswordResetCreate({ requestBody: data })
      setSubmitted(true)
    } catch (err) {
      const apiError = err as ApiError
      const body = apiError.body as { error?: string }
      setError(body?.error ?? "Failed to send reset email")
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="If an account exists with that email, you will receive password reset instructions."
        footerText="Return to"
        footerLinkText="login"
        footerLink="/login"
      >
        <div className="grid gap-6">
          <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
            Try another email
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
      footerText="Remember your password?"
      footerLinkText="Back to login"
      footerLink="/login"
    >
      <div className="grid gap-6">
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isSubmitting}
              />
              {errors.email && (
                <span className="text-sm text-red-500">Please enter a valid email</span>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}

            <Button disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Reset Link
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
