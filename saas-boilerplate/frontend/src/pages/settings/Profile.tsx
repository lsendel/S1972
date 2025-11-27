import React from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"

export default function ProfileSettings() {
  const { user } = useAuth()
  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    }
  })

  const onSubmit = async (data: any) => {
    // TODO: Implement profile update
    console.log('Update profile:', data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <Input {...register("full_name")} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input {...register("email")} disabled className="bg-gray-100" />
          <p className="text-sm text-gray-500 mt-1">Contact support to change your email</p>
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  )
}
