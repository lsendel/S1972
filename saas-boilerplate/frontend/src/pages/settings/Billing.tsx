import React from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import client from "@/api/client"

export default function BillingSettings() {
  const { orgSlug } = useParams<{ orgSlug: string }>()

  const { data: subscription } = useQuery({
    queryKey: ['subscriptions', 'current', orgSlug],
    queryFn: () => client.get(`/subscriptions/current/?organization=${orgSlug}`),
  })

  const { data: plans } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: () => client.get('/subscriptions/plans/'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing</p>
      </div>

      {subscription && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
          <div className="space-y-2">
            <p><strong>Plan:</strong> {subscription.plan_details?.name}</p>
            <p><strong>Status:</strong> {subscription.status}</p>
            <p><strong>Billing Cycle:</strong> {subscription.billing_cycle}</p>
          </div>
          <div className="mt-4">
            <Button>Manage Subscription</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {plans?.map((plan: any) => (
            <div key={plan.id} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold my-2">${plan.price_monthly}/mo</p>
              <p className="text-sm text-gray-600">{plan.description}</p>
              <Button className="mt-4 w-full">Select Plan</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
