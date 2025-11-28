import React from "react"
import { useParams } from "react-router-dom"
import { useOrganization, useOrganizations } from "@/hooks/useOrganization"
import { useAuth } from "@/hooks/useAuth"
import { DashboardSkeleton } from "@/components/LoadingSkeletons"

export default function Dashboard() {
  const { orgSlug } = useParams()
  const { data: organization, isLoading: orgLoading } = useOrganization(orgSlug)
  const { data: organizations, isLoading: orgsLoading } = useOrganizations()
  const { user } = useAuth()

  if (orgLoading || orgsLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-gray-600">Organization: {organization?.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Team Members</h3>
          <p className="text-3xl font-bold mt-2">{organization?.member_count || 0}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Your Role</h3>
          <p className="text-3xl font-bold mt-2 capitalize">{organization?.role}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Organizations</h3>
          <p className="text-3xl font-bold mt-2">{organizations?.length || 0}</p>
        </div>
      </div>
    </div>
  )
}
