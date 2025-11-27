import React from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data: any) => {
    try {
      await login(data)
      navigate('/app')
    } catch (error) {
      console.error(error)
      // Handle error (e.g. show toast)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Input
                {...register("email", { required: true })}
                type="email"
                placeholder="Email address"
                autoComplete="email"
              />
              {errors.email && <span className="text-sm text-red-500">Email is required</span>}
            </div>
            <div>
              <Input
                {...register("password", { required: true })}
                type="password"
                placeholder="Password"
                autoComplete="current-password"
              />
              {errors.password && <span className="text-sm text-red-500">Password is required</span>}
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center text-sm">
            <Link to="/signup" className="font-medium text-primary hover:text-primary/90">
                Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
