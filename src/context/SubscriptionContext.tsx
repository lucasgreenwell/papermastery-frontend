import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { stripeApi } from '@/api/stripe-api';

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
  redirectToCheckout: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check subscription status when user changes or on mount
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    } else {
      setHasActiveSubscription(false);
      setIsLoading(false);
    }
  }, [user]);
  
  // Also check subscription status immediately on mount
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, []);

  // Function to check subscription status
  const checkSubscriptionStatus = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { hasActiveSubscription: status } = await stripeApi.checkSubscriptionStatus();
      setHasActiveSubscription(status);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to redirect to Stripe checkout
  const redirectToCheckout = async () => {
    try {
      const { url } = await stripeApi.createCheckoutSession('premium_subscription');
      window.location.href = url;
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      hasActiveSubscription,
      isLoading,
      checkSubscriptionStatus,
      redirectToCheckout
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
};