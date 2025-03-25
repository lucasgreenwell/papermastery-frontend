import { api } from '@/services/apiClient';

interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  end_date?: string;
}

/**
 * API functions for Stripe integration
 */
export const stripeApi = {
  /**
   * Create a checkout session for subscription payment
   */
  async createCheckoutSession(
    productType: 'premium_subscription', 
    returnUrl?: string
  ): Promise<{ url: string }> {
    return api.post<{ url: string }>('/payments/checkout', { 
      productType,
      returnUrl  // If provided, will be used instead of the default success URL
    });
  },

  /**
   * Check if user has an active subscription
   */
  async checkSubscriptionStatus(): Promise<{ hasActiveSubscription: boolean }> {
    return api.get<{ hasActiveSubscription: boolean }>('/payments/subscription-status');
  },
  
  /**
   * Cancel the user's subscription
   */
  async cancelSubscription(): Promise<CancelSubscriptionResponse> {
    return api.post<CancelSubscriptionResponse>('/payments/cancel-subscription');
  }
};