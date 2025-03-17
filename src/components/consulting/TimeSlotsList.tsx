import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Clock, 
  Calendar, 
  Check, 
  MessageCircle, 
  Loader2,
  CalendarCheck,
  X,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Researcher } from './ResearcherSidebar';
import { consultingApi } from '@/api/consulting-api';
import { createSessionRequestFromTimeSlot, formatTimeForDisplay } from '@/api/adapters';
import { TimeSlot as TimeSlotType } from '@/api/models';
import { toast } from '@/components/ui/use-toast';

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  available: boolean;
  researcher_id: string;
}

interface TimeSlotsListProps {
  timeSlots: TimeSlot[] | null;
  loading: boolean;
  error: string | null;
  selectedDate: Date | null;
  selectedResearcher: Researcher | null;
  onBookingConfirmed: (timeSlotId: string, date: Date, questions?: string) => Promise<void>;
  hasSubscription?: boolean;
  onTimeSlotSelect: (timeSlot: TimeSlot | null) => void;
  selectedTimeSlot: TimeSlot | null;
  paperId?: string;
}

const TimeSlotsList = ({
  timeSlots,
  loading,
  error,
  selectedDate,
  selectedResearcher,
  onBookingConfirmed,
  hasSubscription = true, // Default to true since we're assuming all users are subscribed
  onTimeSlotSelect,
  selectedTimeSlot: externalSelectedTimeSlot,
  paperId
}: TimeSlotsListProps) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(externalSelectedTimeSlot);
  const [bookingQuestions, setBookingQuestions] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    setSelectedTimeSlot(externalSelectedTimeSlot);
  }, [externalSelectedTimeSlot]);
  
  // Handler for slot selection
  const handleSelectTimeSlot = (timeSlot: TimeSlot) => {
    const newSelected = selectedTimeSlot?.id === timeSlot.id ? null : timeSlot;
    setSelectedTimeSlot(newSelected);
    onTimeSlotSelect(newSelected);
    
    if (newSelected) {
      setDialogOpen(true);
    }
  };
  
  // Handler for booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot || !selectedDate || !selectedResearcher) return;
    
    setIsConfirming(true);
    
    try {
      // Create a session request from time slot
      const sessionRequest = createSessionRequestFromTimeSlot(
        selectedTimeSlot as TimeSlotType,
        paperId,
        bookingQuestions || undefined
      );
      
      // Create the session
      const session = await consultingApi.createSession(sessionRequest);
      
      // If successful, create a payment intent
      const paymentIntent = await consultingApi.createPaymentIntent({
        type: 'session',
        session_id: session.id
      });
      
      // TODO: Implement Stripe payment flow with the client_secret
      // For now, just simulate successful payment
      toast({
        title: "Booking Confirmed",
        description: `Your session with ${selectedResearcher.name} has been booked.`,
      });
      
      // Notify parent component
      await onBookingConfirmed(selectedTimeSlot.id, selectedDate, bookingQuestions);
      
      setDialogOpen(false);
      setBookingQuestions('');
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was a problem booking your session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // When dialog closes, notify parent if booking wasn't confirmed
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && !isConfirming) {
      // Only reset selection if the user explicitly cancelled
      setSelectedTimeSlot(null);
      onTimeSlotSelect(null);
    }
  };
  
  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-4 py-3 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
          <CardDescription>
            Select a convenient time slot
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-3 flex-grow">
          <div className="space-y-3 w-full">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-4 py-3 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3 flex-grow flex items-center justify-center">
          <div className="text-destructive text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }
  
  // If no researcher is selected, show a message
  if (!selectedResearcher) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-4 py-3 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3 flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm">Select a researcher to view available time slots</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If no date is selected, show a message
  if (!selectedDate) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-4 py-3 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
          <CardDescription>
            For {selectedResearcher.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-3 flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm">Select a date to view available time slots</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If no time slots are available for the selected date
  if (!timeSlots || timeSlots.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-4 py-3 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Available Times</span>
          </CardTitle>
          <CardDescription>
            {format(selectedDate, 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-3 flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm">No time slots available for this date</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-5 py-4 flex-shrink-0 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span>Available Times</span>
        </CardTitle>
        <CardDescription>
          {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date to view times'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-4 flex-grow overflow-auto">
        <div className="space-y-3">
          {timeSlots?.map((slot) => (
            <Button
              key={slot.id}
              variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
              className={`w-full justify-start h-auto py-3 px-4 text-left font-normal text-sm rounded-lg transition-all
                ${selectedTimeSlot?.id === slot.id 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 font-medium shadow-sm' 
                  : 'hover:bg-blue-50 hover:border-blue-200'}`}
              disabled={!slot.available}
              onClick={() => handleSelectTimeSlot(slot)}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">
                  {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
      
      {/* Booking confirmation dialog */}
      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          // Only allow programmatic closing, prevent user-initiated closing
          if (open === false && !isConfirming) {
            // Do nothing - prevents closing
          } else {
            setDialogOpen(open);
          }
        }}
        modal={true}
      >
        <DialogContent 
          className="sm:max-w-xl z-50 rounded-xl p-0 overflow-hidden border-0 shadow-xl [&>button]:hidden [&>.absolute.right-4.top-4]:hidden"
          onEscapeKeyDown={(e) => {
            // Prevent closing with Escape key
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}
        >
          <div className="bg-blue-600 text-white p-6 relative">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-white m-0 p-0">Confirm Your Booking</DialogTitle>
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
            <DialogDescription className="text-blue-100 mt-2 mb-0">
              You're booking a premium consultation session
            </DialogDescription>
          </div>
          
          <div className="p-6">
            <div className="bg-blue-50 rounded-lg p-4 mb-5 border border-blue-100">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expert:</span>
                  <span className="font-medium text-gray-900">{selectedResearcher?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time:</span>
                  <span className="font-medium text-gray-900">
                    {selectedTimeSlot && formatTimeForDisplay(selectedTimeSlot.start_time)} - {selectedTimeSlot && formatTimeForDisplay(selectedTimeSlot.end_time)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200 mt-1">
                  <span className="text-sm text-gray-600">Session Fee:</span>
                  <span className="font-semibold text-gray-900">${selectedResearcher?.rate}.00</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="questions" className="text-sm font-medium mb-2 block text-gray-700">
                Questions or Topics for Discussion
              </label>
              <Textarea 
                id="questions"
                placeholder="Share specific questions or topics you'd like to cover during the session..."
                value={bookingQuestions}
                onChange={(e) => setBookingQuestions(e.target.value)}
                className="min-h-[120px] rounded-lg border-gray-300 focus:border-blue-400 focus:ring-blue-300 resize-none p-3 shadow-sm"
              />
              
              <div className="mt-3 mb-5">
                <p className="text-xs text-gray-500 mb-2">Suggested topics based on this paper:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Research methodology questions",
                    "Theoretical implications",
                    "Practical applications",
                    "Future research directions",
                    "Connections to related work"
                  ].map((topic, index) => (
                    <button
                      key={index}
                      type="button"
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded-md transition-colors"
                      onClick={() => setBookingQuestions(prev => 
                        prev ? `${prev}\n\n${topic}:` : `${topic}:`
                      )}
                    >
                      + {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 p-6 pt-4 bg-gray-50">
            <div className="mb-5 text-xs space-y-3 text-gray-600">
              <p className="text-xs font-medium text-gray-500 mb-2">Important information:</p>
              <div className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <p>Your payment information is encrypted and secure</p>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <p>Free cancellation up to 24 hours before the session</p>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <p>You'll receive a confirmation email with Zoom link and calendar invitation</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">You'll complete payment securely via Stripe</p>
                <p className="text-xs text-gray-500">Your payment information is protected with industry-standard encryption</p>
              </div>
              <div className="flex-shrink-0">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
              </div>
            </div>
            
            <DialogFooter className="flex justify-between w-full gap-3">
              <Button 
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800 rounded-lg px-6 py-2.5 h-auto font-medium text-sm shadow-sm"
                onClick={() => setDialogOpen(false)}
              >
                Back
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-2.5 h-auto font-medium text-sm flex-1 shadow-sm"
                onClick={handleConfirmBooking} 
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Continue
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TimeSlotsList; 