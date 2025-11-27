import React, { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import client from "@/api/client"

interface Member {
  id: string
  user_email: string
  user_full_name: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: 'admin' | 'member'
  status: string
  created_at: string
  invited_by_email: string
}

export default function TeamSettings() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [showInviteForm, setShowInviteForm] = useState(false)

  const { data: members, isLoading } = useQuery({
    queryKey: ['organizations', orgSlug, 'members'],
    queryFn: () => client.get<Member[]>(`/organizations/${orgSlug}/members/`),
  })

  const { data: invitations } = useQuery({
    queryKey: ['organizations', orgSlug, 'invitations'],
    queryFn: () => client.get<Invitation[]>(`/organizations/${orgSlug}/invitations/`),
  })

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      client.post(`/organizations/${orgSlug}/members/invite/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug, 'invitations'] })
      setInviteEmail('')
      setShowInviteForm(false)
    },
  })

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    try {
      await inviteMutation.mutateAsync({ email: inviteEmail, role: inviteRole })
    } catch (error: any) {
      alert(error?.error || 'Failed to send invitation')
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Members</h1>
        <p className="text-gray-600">Manage your organization's team</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {!showInviteForm ? (
          <Button onClick={() => setShowInviteForm(true)}>Invite Team Member</Button>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Current Members</h2>
        <div className="space-y-4">
          {members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="font-medium">{member.user_full_name || member.user_email}</div>
                <div className="text-sm text-gray-600">{member.user_email}</div>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {invitations && invitations.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Pending Invitations</h2>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{invitation.email}</div>
                  <div className="text-sm text-gray-600">Invited by {invitation.invited_by_email}</div>
                </div>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm">{invitation.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
