import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { api } from "@/api/config"
import TwoFactorAuth from "@/components/TwoFactorAuth"
import OAuthConnections from "@/components/OAuthConnections"
import { useToast } from "@/hooks/useToast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import type { ApiError } from "@/api/generated"

const passwordChangeSchema = z.object({
  old_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(10, "Password must be at least 10 characters"),
  confirm_password: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
})

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

export default function SecuritySettings() {
  const { success, error } = useToast()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema)
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeFormValues) => {
      await api.auth.authPasswordChangeCreate({
        requestBody: {
          old_password: data.old_password,
          new_password: data.new_password,
        }
      })
    },
    onSuccess: () => {
      success('Password changed successfully')
      reset()
    },
    onError: (err: ApiError) => {
      const body = err.body as { error?: string, detail?: string }
      error(body?.error ?? body?.detail ?? 'Failed to change password')
    },
  })

  const onSubmit = (data: PasswordChangeFormValues) => {
    changePasswordMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security</h3>
        <p className="text-sm text-muted-foreground">
          Manage your password and security preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="old_password">Current Password</Label>
              <Input
                id="old_password"
                type="password"
                {...register("old_password")}
                className={errors.old_password ? "border-red-500" : ""}
              />
              {errors.old_password && (
                <p className="text-sm text-red-500">{errors.old_password.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                {...register("new_password")}
                className={errors.new_password ? "border-red-500" : ""}
              />
              {errors.new_password && (
                <p className="text-sm text-red-500">{errors.new_password.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                {...register("confirm_password")}
                className={errors.confirm_password ? "border-red-500" : ""}
              />
              {errors.confirm_password && (
                <p className="text-sm text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorAuth />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected OAuth accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthConnections />
        </CardContent>
      </Card>
    </div>
  )
}
