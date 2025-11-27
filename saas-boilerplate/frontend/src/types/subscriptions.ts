export interface Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    is_active: boolean;
}

export interface Subscription {
    id: string;
    plan: Plan;
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    billing_cycle: 'monthly' | 'yearly';
    current_period_end: string;
    cancel_at_period_end: boolean;
}

export interface CheckoutSession {
    checkout_url: string;
    session_id: string;
}
