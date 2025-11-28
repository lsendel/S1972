import { useParams } from "react-router-dom"
import { useOrganization, useOrganizations } from "@/hooks/useOrganization"
import { useAuth } from "@/hooks/useAuth"
import { DashboardSkeleton } from "@/components/LoadingSkeletons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, UserCircle } from "lucide-react"

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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization?.member_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active members in {organization?.name}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Role
            </CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{organization?.role}</div>
            <p className="text-xs text-muted-foreground">
              Current permissions level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total organizations you belong to
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
