import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { stripeApi } from '@/api/stripe-api';

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
  redirectToCheckout: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Debounce function to prevent multiple rapid calls
function debounce<T extends (...args: any[]) => Promise<void>>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const statusCheckRef = useRef<boolean>(false);

  // Function to check subscription status
  const checkSubscriptionStatusImpl = useCallback(async () => {
    if (!user) return;
    
    // Prevent duplicate requests
    if (statusCheckRef.current) return;
    statusCheckRef.current = true;
    
    setIsLoading(true);
    try {
      const { hasActiveSubscription: status } = await stripeApi.checkSubscriptionStatus();
      setHasActiveSubscription(status);
      console.log(`Subscription check completed. Status: ${status ? 'Active' : 'Inactive'}`);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsLoading(false);
      statusCheckRef.current = false;
    }
  }, [user]);

  // Debounced version to prevent rapid consecutive calls
  const checkSubscriptionStatus = useCallback(
    debounce(checkSubscriptionStatusImpl, 500),
    [checkSubscriptionStatusImpl]
  );

  // Only check subscription status when user changes - once
  useEffect(() => {
    if (user) {
      checkSubscriptionStatusImpl(); // Use the non-debounced version for the initial check
    } else {
      setHasActiveSubscription(false);
      setIsLoading(false);
    }
  }, [user, checkSubscriptionStatusImpl]);

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
      checkSubscriptionStatus: checkSubscriptionStatus, // Use the debounced version to prevent excessive API calls
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