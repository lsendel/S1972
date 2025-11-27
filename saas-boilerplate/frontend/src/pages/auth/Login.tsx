import React from "react"
import { useForm } from "react-hook-form"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"

export default function Login() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [requires2FA, setRequires2FA] = React.useState(false)
  const [loginError, setLoginError] = React.useState<string | null>(null)

  const onSubmit = async (data: any) => {
    setLoginError(null);
    try {
      await login(data)
      navigate('/app')
    } catch (error: any) {
      console.error(error)
      if (error.code === '2fa_required') {
        setRequires2FA(true)
      } else {
        setLoginError(error.detail || "Invalid credentials")
      }
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
            {!requires2FA && (
              <>
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
              </>
            )}

            {requires2FA && (
              <div>
                  <div className="mb-4 text-center text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app.
                  </div>
                  <Input
                    {...register("otp_code", { required: true })}
                    placeholder="2FA Code"
                    autoComplete="one-time-code"
                  />
                   {errors.otp_code && <span className="text-sm text-red-500">Code is required</span>}
              </div>
            )}
          </div>

          {loginError && <div className="text-sm text-red-500 text-center">{loginError}</div>}

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : (requires2FA ? 'Verify' : 'Sign in')}
            </Button>
          </div>

           {requires2FA && (
              <div className="text-center">
                  <button type="button" onClick={() => setRequires2FA(false)} className="text-sm text-primary hover:underline">
                      Back to login
                  </button>
              </div>
          )}

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
