import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConsultingStepProps {
  paperId: string;
  onComplete: () => void;
}

export default function ConsultingStep({ paperId, onComplete }: ConsultingStepProps) {
  const { user } = useAuth();
  const { hasActiveSubscription, redirectToCheckout, isLoading: checkingSubscription } = useSubscription();
  const [hasViewedInfo, setHasViewedInfo] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  
  // Mark as completed when user views consulting info
  const handleViewInfo = () => {
    if (!hasViewedInfo) {
      setHasViewedInfo(true);
      onComplete();
    }

    // If user has no active subscription, show subscription prompt dialog
    if (!hasActiveSubscription && !checkingSubscription) {
      setIsSubscriptionDialogOpen(true);
      return;
    }
  };

  // Handle subscription checkout redirect
  const handleCheckoutRedirect = async () => {
    setIsRedirectingToStripe(true);
    await redirectToCheckout();
    setIsRedirectingToStripe(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Expert Consulting</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Premium</Badge>
      </div>
      
      <p className="text-muted-foreground">
        Connect directly with researchers or domain experts who can answer your specific questions about this paper.
      </p>
      
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Book a 1-on-1 Session</CardTitle>
          <CardDescription>
            Schedule a private video conference with an expert who can explain complex concepts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">15-minute sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Video conference</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Flexible scheduling</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Custom Q&A</span>
            </div>
          </div>
          
          <div className="pt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              3 experts available
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          {hasActiveSubscription ? (
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleViewInfo}
              asChild
            >
              <Link to={`/papers/${paperId}/consulting`}>
                Book a Session <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleViewInfo}
            >
              Book a Session <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Separator className="my-6" />
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Why Consult with Experts?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Deeper Understanding</h4>
            <p className="text-muted-foreground">
              Get personalized explanations of complex concepts, methods, and implications.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Research Guidance</h4>
            <p className="text-muted-foreground">
              Receive advice on how to apply the paper's findings to your own work.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Networking</h4>
            <p className="text-muted-foreground">
              Build connections with leading researchers in your field of interest.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Dialog */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Premium Feature</DialogTitle>
            <DialogDescription>
              Consulting sessions are available for premium subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-800 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Premium Subscription Benefits</span>
              </h4>
              <ul className="mt-2 space-y-2 text-sm text-blue-700">
                <li className="flex gap-2 items-start">
                  <span className="bg-blue-100 text-blue-600 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span>1-on-1 video consultations with domain experts</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="bg-blue-100 text-blue-600 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span>Unlimited expert sessions per month</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="bg-blue-100 text-blue-600 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span>Access to all other premium features</span>
                </li>
              </ul>
              <p className="mt-3 text-sm font-medium text-blue-700">
                $19.99/month - Cancel anytime
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsSubscriptionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckoutRedirect}
              disabled={isRedirectingToStripe}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRedirectingToStripe ? (
                <>
                  <span className="animate-spin mr-2">◯</span>
                  Redirecting...
                </>
              ) : (
                <>Subscribe Now</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 