import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

export default function BillingSettings() {
    const { subscription, isLoading } = useSubscription();

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                        You are currently on the <strong>{subscription?.plan?.name || 'Free'}</strong> plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        Status: <span className="capitalize text-foreground font-medium">{subscription?.status || 'Active'}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline">Manage Subscription</Button>
                </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>
                        View your payment history.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">No invoices found.</div>
                </CardContent>
            </Card>
        </div>
    );
}
