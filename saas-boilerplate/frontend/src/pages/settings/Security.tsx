import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import client from "@/api/client"
import TwoFactorAuth from "@/components/TwoFactorAuth"
import OAuthConnections from "@/components/OAuthConnections"

export default function SecuritySettings() {
  const { register, handleSubmit, reset, watch } = useForm()
  const newPassword = watch("new_password")

  const onSubmit = async (data: any) => {
    try {
      await client.post('/auth/password/change/', {
        old_password: data.old_password,
        new_password: data.new_password,
      })
      alert('Password changed successfully')
      reset()
    } catch (error: any) {
      alert(error?.error || 'Failed to change password')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-gray-600">Manage your password and security preferences</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <Input type="password" {...register("old_password", { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <Input type="password" {...register("new_password", { required: true, minLength: 10 })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <Input
              type="password"
              {...register("confirm_password", {
                required: true,
                validate: value => value === newPassword || "Passwords do not match"
              })}
            />
          </div>
          <Button type="submit">Change Password</Button>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <TwoFactorAuth />
      </div>

      <div className="rounded-lg border bg-white p-6">
        <OAuthConnections />
      </div>
    </div>
  )
}
