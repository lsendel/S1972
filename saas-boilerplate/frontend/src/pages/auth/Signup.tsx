import React from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data: any) => {
    try {
      await signup(data)
      navigate('/login') // Or onboarding
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create your account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
             <div>
              <Input
                {...register("full_name")}
                type="text"
                placeholder="Full Name"
                autoComplete="name"
              />
            </div>
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
                {...register("password", { required: true, minLength: 8 })}
                type="password"
                placeholder="Password"
                autoComplete="new-password"
              />
              {errors.password && <span className="text-sm text-red-500">Password must be at least 8 chars</span>}
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing up...' : 'Sign up'}
            </Button>
          </div>

           <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
