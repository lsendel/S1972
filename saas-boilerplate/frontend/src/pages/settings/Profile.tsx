import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/api/config"
import { useToast } from "@/hooks/useToast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ApiError } from "@/api/generated"

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email().optional(), // Email is disabled but kept in form
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfileSettings() {
  const { user } = useAuth()
  const { success, error } = useToast()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await api.auth.authMePartialUpdate({
        requestBody: {
          full_name: data.full_name,
        }
      })
      return response
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      success('Your profile has been updated successfully.')
    },
    onError: (err: ApiError) => {
      const body = err.body as { message?: string, detail?: string }
      error(body?.message ?? body?.detail ?? 'Failed to update profile. Please try again.')
    },
  })

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...register("email")} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email
              </p>
            </div>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
