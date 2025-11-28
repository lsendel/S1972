import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/api/config"
import { Loader2, Mail, Shield, User } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type ApiError, RoleEnum } from "@/api/generated"

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "member"]),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export default function TeamSettings() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const [showInviteForm, setShowInviteForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'member'
    }
  })

  const { data: members, isLoading } = useQuery({
    queryKey: ['organizations', orgSlug, 'members'],
    queryFn: () => api.organizations.organizationsMembersList({ organizationSlug: orgSlug! }),
    enabled: !!orgSlug,
  })

  const { data: invitations } = useQuery({
    queryKey: ['organizations', orgSlug, 'invitations'],
    queryFn: () => api.organizations.organizationsInvitationsList({ organizationSlug: orgSlug! }),
    enabled: !!orgSlug,
  })

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormValues) =>
      api.organizations.organizationsMembersInviteCreate({
        organizationSlug: orgSlug!,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        requestBody: { email: data.email, role: data.role as RoleEnum } as any
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug, 'invitations'] })
      success('Invitation sent successfully')
      reset()
      setShowInviteForm(false)
    },
    onError: (err: ApiError) => {
      const body = err.body as { error?: string }
      error(body?.error ?? 'Failed to send invitation')
    },
  })

  const onInvite = (data: InviteFormValues) => {
    inviteMutation.mutate(data)
  }

  if (isLoading) return <div className="p-4 text-center text-gray-500">Loading team members...</div>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Team</h3>
        <p className="text-sm text-muted-foreground">
          Manage your organization's team members and invitations.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Invite and manage team members.
            </CardDescription>
          </div>
          {!showInviteForm && (
            <Button onClick={() => setShowInviteForm(true)}>Invite Member</Button>
          )}
        </CardHeader>
        <CardContent>
          {showInviteForm && (
            <div className="mb-6 rounded-lg border p-4 bg-muted/50">
              <form onSubmit={(e) => void handleSubmit(onInvite)(e)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@example.com"
                      {...register("email")}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <select
                      id="invite-role"
                      {...register("role")}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && (
                      <p className="text-sm text-red-500">{errors.role.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Invite
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{member.user_full_name || member.user_email}</div>
                    <div className="text-sm text-muted-foreground">{member.user_email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === RoleEnum.OWNER && <Shield className="h-4 w-4 text-primary" />}
                  <span className="text-sm capitalize text-muted-foreground">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground">Invited by {invitation.invited_by_email}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {invitation.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
