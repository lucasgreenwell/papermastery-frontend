import { api } from '@/services/apiClient';

/**
 * API functions for Stripe integration
 */
export const stripeApi = {
  /**
   * Create a checkout session for subscription payment
   */
  async createCheckoutSession(productType: 'premium_subscription'): Promise<{ url: string }> {
    return api.post<{ url: string }>('/payments/checkout', { productType });
  },

  /**
   * Check if user has an active subscription
   */
  async checkSubscriptionStatus(): Promise<{ hasActiveSubscription: boolean }> {
    return api.get<{ hasActiveSubscription: boolean }>('/payments/subscription-status');
  }
};