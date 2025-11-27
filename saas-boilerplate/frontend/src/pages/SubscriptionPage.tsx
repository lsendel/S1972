import React, { useEffect, useState } from 'react';
import { subscriptionsApi } from '@/api/subscriptions';
import { Plan, Subscription } from '@/types/subscriptions';
import { Button } from '@/components/ui/button';

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [plansData, subsData] = await Promise.all([
                subscriptionsApi.listPlans(),
                subscriptionsApi.listSubscriptions()
            ]);
            setPlans(plansData);
            if (subsData.length > 0) {
                setSubscription(subsData[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        try {
            const session: any = await subscriptionsApi.createCheckoutSession(planId, 'monthly');
            // Mock alert
            alert(`Redirecting to checkout for ${planId}: ${session.checkout_url}`);
        } catch (err) {
            console.error("Checkout failed", err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-gray-500">Manage your subscription plan.</p>
            </div>

            {subscription ? (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">Current Subscription</h2>
                    <p className="text-gray-700">You are subscribed to <span className="font-bold">{subscription.plan.name}</span></p>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>Status: <span className="capitalize font-medium text-black">{subscription.status}</span></p>
                        <p>Billing: {subscription.billing_cycle}</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map(plan => (
                        <div key={plan.id} className="flex flex-col rounded-lg border bg-white shadow-sm">
                            <div className="p-6">
                                <h3 className="text-2xl font-bold">{plan.name}</h3>
                                <p className="text-gray-500 text-sm">${plan.price_monthly}/month</p>
                            </div>
                            <div className="p-6 pt-0 flex-1">
                                {plan.features && plan.features.length > 0 && (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="text-sm">{feature}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="p-6 pt-0">
                                <Button className="w-full" onClick={() => handleSubscribe(plan.id)}>Subscribe</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
