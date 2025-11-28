import axios from 'axios';

import { API_BASE_URL } from './config';

export interface CheckoutSessionPayload {
  planId: string;
  organization: string;
  billingCycle: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}

export interface BillingPortalPayload {
  organization: string;
  returnUrl: string;
}

const baseUrl = `${API_BASE_URL}/api/v1/subscriptions`;

export const subscriptionsApi = {
  getPlans: async () => {
    const { data } = await axios.get(`${baseUrl}/plans/`, { withCredentials: true });
    return data;
  },

  getCurrent: async (organization: string) => {
    const { data } = await axios.get(`${baseUrl}/current/`, {
      params: { organization },
      withCredentials: true,
    });
    return data;
  },

  createCheckoutSession: async (payload: CheckoutSessionPayload) => {
    const { data } = await axios.post(
      `${baseUrl}/checkout/session/`,
      {
        plan_id: payload.planId,
        organization: payload.organization,
        billing_cycle: payload.billingCycle,
        success_url: payload.successUrl,
        cancel_url: payload.cancelUrl,
      },
      { withCredentials: true },
    );
    return data as { checkout_url: string; session_id: string };
  },

  createBillingPortalSession: async (payload: BillingPortalPayload) => {
    const { data } = await axios.post(
      `${baseUrl}/billing/portal/`,
      {
        organization: payload.organization,
        return_url: payload.returnUrl,
      },
      { withCredentials: true },
    );
    return data as { portal_url: string; session_id: string };
  },
};
