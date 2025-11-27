import client from './client';
import { Plan, Subscription, CheckoutSession } from '../types/subscriptions';

export const subscriptionsApi = {
    listPlans: async () => {
        const response: any = await client.get('/subscriptions/plans/');
        // Standard DRF pagination returns { results: [...] }
        if (response.results && Array.isArray(response.results)) return response.results as Plan[];
        if (Array.isArray(response)) return response as Plan[];
        return [] as Plan[];
    },
    listSubscriptions: async () => {
        const response: any = await client.get('/subscriptions/subscriptions/');
        if (response.results && Array.isArray(response.results)) return response.results as Subscription[];
        if (Array.isArray(response)) return response as Subscription[];
        return [] as Subscription[];
    },
    createCheckoutSession: (planId: string, cycle: 'monthly' | 'yearly') =>
        client.post<CheckoutSession>('/subscriptions/subscriptions/checkout/', { plan_id: planId, cycle }),
};
