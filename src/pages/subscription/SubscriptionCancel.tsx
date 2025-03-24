import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionCancel() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card className="border-amber-100 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-amber-500" />
          </div>
          <CardTitle className="text-2xl text-center">Subscription Cancelled</CardTitle>
          <CardDescription className="text-center">
            Your subscription process was cancelled
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 text-center">
          <p className="text-muted-foreground">
            You've cancelled the subscription process. No changes have been made to your account. You can subscribe anytime to access our premium features.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link to="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="w-full"
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}