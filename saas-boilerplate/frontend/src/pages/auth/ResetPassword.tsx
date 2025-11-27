import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useParams, useNavigate } from "react-router-dom"
import client from "@/api/client"

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [error, setError] = useState<string | null>(null)

  const password = watch("password")

  const onSubmit = async (data: any) => {
    try {
      setError(null)
      await client.post('/auth/password/reset/confirm/', {
        token,
        password: data.password
      })

      // Redirect to login with success message
      navigate('/login?reset=success')
    } catch (err: any) {
      setError(err?.error || "Failed to reset password. The link may have expired.")
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
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
              {...register("password", {
                required: "Password is required",
                minLength: { value: 10, message: "Password must be at least 10 characters" }
              })}
              type="password"
              placeholder="New password"
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="text-sm text-red-500">{errors.password.message as string}</span>
            )}
          </div>

          <div>
            <Input
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: value => value === password || "Passwords do not match"
              })}
              type="password"
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="text-sm text-red-500">{errors.confirmPassword.message as string}</span>
            )}
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
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
