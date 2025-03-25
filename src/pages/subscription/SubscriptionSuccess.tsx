import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/context/SubscriptionContext';

export default function SubscriptionSuccess() {
  const location = useLocation();
  const { checkSubscriptionStatus } = useSubscription();
  const statusCheckDone = useRef(false);
  
  // Get the session ID from the URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  // When the page loads, check the subscription status to update the context
  useEffect(() => {
    // Prevent multiple status checks
    if (statusCheckDone.current) return;
    
    const updateSubscriptionStatus = async () => {
      // Check for "mock" in sessionId, which indicates we're using the mock success flow
      if (sessionId?.includes('mock')) {
        console.log('Mock session detected, creating test subscription in database');
        // For mock sessions, we'll directly create a subscription record in the database
        try {
          // This would normally happen via Stripe webhooks
          // We're doing it manually here for testing purposes only
          await fetch('/api/v1/payments/create-test-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId })
          });
          console.log('Test subscription created');
        } catch (error) {
          console.error('Error creating test subscription:', error);
        }
      }
      
      // Check subscription status exactly once
      console.log('Checking subscription status after payment');
      await checkSubscriptionStatus();
      statusCheckDone.current = true;
    };
    
    updateSubscriptionStatus();
    
    // Clean up function not needed since we're using a ref to track status
  }, [checkSubscriptionStatus, sessionId]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card className="border-green-100 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">Subscription Successful!</CardTitle>
          <CardDescription className="text-center text-green-700">
            Your premium subscription has been activated
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 text-center">
          <p className="text-muted-foreground">
            Thank you for subscribing to our premium plan. You now have full access to all premium features, including consulting sessions with experts.
          </p>
          {sessionId && (
            <p className="mt-4 text-sm text-muted-foreground">
              Reference: {sessionId}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link to="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/papers">
              Explore Papers
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}