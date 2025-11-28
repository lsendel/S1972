import { useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { subscriptionsApi } from "@/api/subscriptions"
import { api } from "@/api/config"
import { Check, CreditCard, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface Plan {
  id: string
  name: string
  description: string
  price_monthly: string
  price_yearly?: string
  features?: string[]
}

interface Subscription {
  plan_details: Plan
  status: string
  billing_cycle: string
}

function Banner({ tone, message }: { tone: "info" | "warning" | "success" | "error"; message: string }) {
  const toneClasses = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-900",
  }
  const Icon = Info
  return (
    <div className={cn("flex items-start gap-2 rounded-md border p-3 text-sm", toneClasses[tone])}>
      <Icon className="mt-0.5 h-4 w-4" />
      <span>{message}</span>
    </div>
  )
}

export default function BillingSettings() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const statusParam = searchParams.get("status")
  const origin = useMemo(() => window.location.origin, [])

  const { data: organization } = useQuery({
    queryKey: ["organization", orgSlug],
    enabled: Boolean(orgSlug),
    queryFn: () => api.organizations.organizationsRetrieve({ slug: orgSlug! }),
  })

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ["subscriptions", "current", orgSlug],
    enabled: Boolean(orgSlug),
    queryFn: () => subscriptionsApi.getCurrent(orgSlug!),
  })

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["subscriptions", "plans"],
    queryFn: () => subscriptionsApi.getPlans(),
  })

  const checkoutMutation = useMutation({
    mutationFn: ({ planId, billingCycle }: { planId: string; billingCycle: "monthly" | "yearly" }) =>
      subscriptionsApi.createCheckoutSession({
        planId,
        organization: orgSlug!,
        billingCycle,
        successUrl: `${origin}/app/${orgSlug}/settings/billing?status=success`,
        cancelUrl: `${origin}/app/${orgSlug}/settings/billing?status=cancelled`,
      }),
    onSuccess: (data) => {
      window.location.href = data.checkout_url
    },
    onError: () => {
      setErrorMessage("Unable to start checkout. Please try again or contact support.")
    },
  })

  const portalMutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.createBillingPortalSession({
        organization: orgSlug!,
        returnUrl: `${origin}/app/${orgSlug}/settings/billing`,
      }),
    onSuccess: (data) => {
      window.location.href = data.portal_url
    },
    onError: () => {
      setErrorMessage("Unable to open billing portal. Please try again or contact support.")
    },
  })

  const handleManageBilling = () => {
    if (!orgSlug || portalMutation.isPending) return
    setErrorMessage(null)
    portalMutation.mutate()
  }

  const handleUpgrade = (planId: string, billingCycle: "monthly" | "yearly") => {
    if (!orgSlug || checkoutMutation.isPending) return
    setErrorMessage(null)
    checkoutMutation.mutate({ planId, billingCycle })
  }

  const loading = subscriptionLoading || plansLoading
  const isPastDue = subscription?.status === "past_due"
  const isTrialing = subscription?.status === "trialing"
  const isOwner = organization?.role === "owner"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing</h3>
        <p className="text-sm text-muted-foreground">Manage your subscription and billing details.</p>
      </div>

      {statusParam === "success" && <Banner tone="success" message="Payment succeeded. Your subscription is updated." />}
      {statusParam === "cancelled" && <Banner tone="info" message="Checkout was cancelled. No changes were made." />}
      {isPastDue && <Banner tone="warning" message="Payment failed or is past due. Some features may be limited until payment is resolved." />}
      {isTrialing && <Banner tone="info" message="You are in a trial period. Add a payment method to stay active after trial ends." />}
      {errorMessage && <Banner tone="error" message={errorMessage} />}
      {organization && !isOwner && (
        <Banner tone="info" message="Only organization owners can manage billing. Contact an owner to change plans." />
      )}

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              You are currently subscribed to the <strong>{subscription.plan_details?.name}</strong> plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{subscription.plan_details?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.status} • Billing: {subscription.billing_cycle}
                  </p>
                </div>
              </div>
              {isOwner && (
                <Button variant="outline" onClick={handleManageBilling} disabled={portalMutation.isPending}>
                  Manage
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              subscription?.plan_details?.id === plan.id ? "border-primary shadow-lg" : "",
              "flex flex-col justify-between"
            )}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${plan.price_monthly}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              {plan.price_yearly && (
                <p className="text-sm text-muted-foreground mt-1">or ${plan.price_yearly}/yr</p>
              )}
              <ul className="mt-4 space-y-2">
                {(plan.features || []).map((feature) => (
                  <li key={feature} className="flex items-center text-sm text-muted-foreground">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {subscription?.plan_details?.id === plan.id ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : isOwner ? (
                <div className="w-full space-y-2">
                  <Button
                    className="w-full"
                    variant="default"
                    disabled={loading || checkoutMutation.isPending}
                    onClick={() => handleUpgrade(plan.id, "monthly")}
                  >
                    Choose Monthly
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    disabled={loading || checkoutMutation.isPending}
                    onClick={() => handleUpgrade(plan.id, "yearly")}
                  >
                    Choose Yearly
                  </Button>
                </div>
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  Owner access required
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
