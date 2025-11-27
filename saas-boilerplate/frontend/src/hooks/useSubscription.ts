import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
}

export interface Subscription {
    id: string;
    plan: Plan;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
    current_period_end: string;
}

const subscriptionApi = {
    getCurrent: () => client.get<Subscription>('/subscriptions/current/'),
    getPlans: () => client.get<Plan[]>('/subscriptions/plans/'),
};

export function useSubscription() {
    const { data: subscription, isLoading } = useQuery({
        queryKey: ['subscription', 'current'],
        queryFn: subscriptionApi.getCurrent,
        retry: false,
    });

    const { data: plans } = useQuery({
        queryKey: ['subscription', 'plans'],
        queryFn: subscriptionApi.getPlans,
    });

    return {
        subscription,
        plans,
        isLoading,
    };
}
