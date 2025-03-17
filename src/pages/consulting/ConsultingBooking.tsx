import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CalendarCheck, 
  Users, 
  Info,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import ResearcherSidebar, { Researcher } from '@/components/consulting/ResearcherSidebar';
import AvailabilityCalendar, { DayAvailability } from '@/components/consulting/AvailabilityCalendar';
import TimeSlotsList, { TimeSlot } from '@/components/consulting/TimeSlotsList';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '../../integrations/supabase/client';
import { usePaperDetails } from '@/hooks/usePaperDetails';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { addDays, format, isSameDay, startOfToday } from 'date-fns';

// Interface for the booking state
interface BookingState {
  availabilityByDay: DayAvailability[];
  timeSlots: TimeSlot[] | null;
  selectedDate: Date | null;
  selectedResearcher: Researcher | null;
  selectedTimeSlot: TimeSlot | null;
  isLoadingAvailability: boolean;
  isLoadingTimeSlots: boolean;
  error: string | null;
  isConfirmationOpen: boolean;
}

export default function ConsultingBooking() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Update to handle the usePaperDetails hook return type correctly
  const paperDetails = usePaperDetails(paperId || '');
  const paper = paperDetails.paper;
  const loadingPaper = paperDetails.isLoading || false;
  const paperError = paperDetails.error || null;
  
  // State for researchers
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loadingResearchers, setLoadingResearchers] = useState(true);
  const [researcherError, setResearcherError] = useState<string | null>(null);
  
  // State for booking
  const [bookingState, setBookingState] = useState<BookingState>({
    availabilityByDay: [],
    timeSlots: null,
    selectedDate: null,
    selectedResearcher: null,
    selectedTimeSlot: null,
    isLoadingAvailability: false,
    isLoadingTimeSlots: false,
    error: null,
    isConfirmationOpen: false
  });
  
  // State for subscription status - always true for now
  const [hasSubscription, setHasSubscription] = useState(true);
  
  // Fetch researchers
  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        setLoadingResearchers(true);
        
        // In a real app, this would be a proper API call to get verified researchers
        // For now, we'll use mock data
        const mockResearchers: Researcher[] = [
          {
            id: 'r1',
            name: 'Dr. Emily Chen',
            email: 'emily.chen@research.edu',
            bio: 'AI research scientist specializing in natural language processing and machine learning',
            expertise: ['NLP', 'Machine Learning', 'Neural Networks'],
            rate: 35,
            verified: true,
            isAuthor: true
          },
          {
            id: 'r2',
            name: 'Prof. Michael Johnson',
            email: 'mjohnson@university.edu',
            bio: 'Professor of Computer Science with expertise in distributed systems and algorithms',
            expertise: ['Distributed Systems', 'Algorithms', 'Computer Science'],
            rate: 40,
            verified: true
          },
          {
            id: 'r3',
            name: 'Dr. Sarah Williams',
            email: 'swilliams@research.org',
            bio: 'Research scientist focusing on reinforcement learning and robotics',
            expertise: ['Reinforcement Learning', 'Robotics', 'AI'],
            rate: 30,
            verified: true
          }
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setResearchers(mockResearchers);
          setLoadingResearchers(false);
        }, 500);
        
      } catch (error) {
        console.error('Error fetching researchers:', error);
        setResearcherError('Failed to load researchers. Please try again later.');
        setLoadingResearchers(false);
      }
    };
    
    // Skip subscription check since we're assuming all users are subscribed
    fetchResearchers();
  }, []);
  
  // When a researcher is selected, fetch their availability
  const handleSelectResearcher = async (researcherId: string) => {
    const researcher = researchers.find(r => r.id === researcherId);
    if (!researcher) return;
    
    setBookingState(prev => ({
      ...prev,
      selectedResearcher: researcher,
      selectedDate: null,
      selectedTimeSlot: null,
      timeSlots: null,
      isLoadingAvailability: true,
      error: null
    }));
    
    try {
      // In a real app, fetch actual availability from API
      // For now, generate mock availability data
      const today = startOfToday();
      const mockAvailability: DayAvailability[] = [];
      
      // Generate 30 days of availability data
      // All researchers have full availability (only skipping weekends)
      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        // Skip weekends
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          mockAvailability.push({
            date: date.toISOString(),
            hasSlots: true // All days are available
          });
        }
      }
      
      // Simulate API delay
      setTimeout(() => {
        setBookingState(prev => ({
          ...prev,
          availabilityByDay: mockAvailability,
          isLoadingAvailability: false
        }));
      }, 500);
      
    } catch (error) {
      console.error('Error fetching availability:', error);
      setBookingState(prev => ({
        ...prev,
        isLoadingAvailability: false,
        error: 'Failed to load availability. Please try again later.'
      }));
    }
  };
  
  // When a date is selected, fetch time slots
  const handleSelectDate = async (date: Date) => {
    if (!bookingState.selectedResearcher) return;
    
    setBookingState(prev => ({
      ...prev,
      selectedDate: date,
      selectedTimeSlot: null,
      timeSlots: null,
      isLoadingTimeSlots: true,
      error: null
    }));
    
    try {
      // In a real app, fetch actual time slots from API
      // For now, generate mock time slots
      const mockTimeSlots: TimeSlot[] = [];
      
      // Generate time slots from 9 AM to 5 PM
      // All time slots are available by default
      for (let hour = 9; hour < 17; hour++) {
        // Skip lunch hour
        if (hour !== 12) {
          const startTime = new Date(date);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(date);
          endTime.setHours(hour, 15, 0, 0);
          
          mockTimeSlots.push({
            id: `slot-${hour}`,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            available: true, // All slots are available
            researcher_id: bookingState.selectedResearcher.id
          });
        }
      }
      
      // Simulate API delay
      setTimeout(() => {
        setBookingState(prev => ({
          ...prev,
          timeSlots: mockTimeSlots,
          isLoadingTimeSlots: false
        }));
      }, 500);
      
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setBookingState(prev => ({
        ...prev,
        isLoadingTimeSlots: false,
        error: 'Failed to load time slots. Please try again later.'
      }));
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: TimeSlot | null) => {
    setBookingState(prev => ({
      ...prev,
      selectedTimeSlot: timeSlot,
      isConfirmationOpen: timeSlot !== null
    }));
  };
  
  // Handle booking confirmation
  const handleBookingConfirmed = async (timeSlotId: string, date: Date, questions?: string) => {
    try {
      // In a real app, this would make an API call to book the session
      // For now, we'll just simulate a successful booking
      console.log('Booking confirmed:', {
        timeSlotId,
        date,
        researcherId: bookingState.selectedResearcher?.id,
        paperId,
        questions
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Booking Confirmed!",
        description: `Your session has been scheduled for ${format(date, 'MMMM d, yyyy')}`,
        duration: 5000,
      });

      setBookingState(prev => ({
        ...prev,
        isConfirmationOpen: false
      }));
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      
      return Promise.reject(error);
    }
  };
  
  // Get selected time slot formatted display time
  const getSelectedTimeDisplay = () => {
    if (!bookingState.selectedTimeSlot) return null;
    
    try {
      const startTime = new Date(bookingState.selectedTimeSlot.start_time);
      const endTime = new Date(bookingState.selectedTimeSlot.end_time);
      return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              className="rounded-full"
            >
              <Link to={`/papers/${paperId}`}>
                <ArrowLeft size={18} />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Book a Consulting Session</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
              Premium Subscriber
            </Badge>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {/* Paper details */}
        {loadingPaper ? (
          <div className="mb-6">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : paperError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error loading paper details</AlertTitle>
            <AlertDescription>
              We couldn't load the paper you're trying to book a session for. Please try again later.
            </AlertDescription>
          </Alert>
        ) : paper ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h2 className="font-medium text-lg">{paper.title}</h2>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Booking steps info */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="font-medium text-blue-700 flex items-center gap-2 mb-2">
              <Info size={16} />
              <span>How booking works</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-blue-800">Select an expert</p>
                  <p className="text-blue-700">Choose from our verified list of researchers and domain experts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-blue-800">Pick a date & time</p>
                  <p className="text-blue-700">Select a convenient time slot from the expert's availability</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-blue-800">Confirm your booking</p>
                  <p className="text-blue-700">Review details and confirm your 15-minute video session</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Booking content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Researchers sidebar */}
          <div className="md:col-span-4 h-[700px]">
            <ResearcherSidebar
              loading={loadingResearchers}
              error={researcherError}
              researchers={researchers}
              selectedResearcher={bookingState.selectedResearcher?.id || null}
              onSelectResearcher={handleSelectResearcher}
              paper={paper}
              hasSubscription={hasSubscription}
            />
          </div>
          
          {/* Calendar */}
          <div className="md:col-span-5 h-[700px]">
            <AvailabilityCalendar
              availabilityByDay={bookingState.availabilityByDay}
              selectedDate={bookingState.selectedDate}
              onSelectDate={handleSelectDate}
              loading={bookingState.isLoadingAvailability}
            />
          </div>
          
          {/* Time slots */}
          <div className="md:col-span-3 h-[700px]">
            <TimeSlotsList
              timeSlots={bookingState.timeSlots}
              loading={bookingState.isLoadingTimeSlots}
              error={bookingState.error}
              selectedDate={bookingState.selectedDate}
              selectedResearcher={bookingState.selectedResearcher}
              selectedTimeSlot={bookingState.selectedTimeSlot}
              onTimeSlotSelect={handleTimeSlotSelect}
              onBookingConfirmed={handleBookingConfirmed}
              hasSubscription={hasSubscription}
            />
          </div>
        </div>

        {/* Bottom booking button - only show when not in confirmation dialog */}
        {bookingState.selectedResearcher && !bookingState.isConfirmationOpen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
            <div className="container mx-auto px-4 py-3 max-w-7xl">
              <div className="bg-white rounded-t-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Session with {bookingState.selectedResearcher.name}</p>
                    <p className="text-xl font-semibold text-gray-900">${bookingState.selectedResearcher.rate}</p>
                    <p className="text-xs text-gray-400">15-minute video consultation</p>
                  </div>
                  <div className="hidden md:block border-l border-gray-200 h-12 mx-2"></div>
                  <div className="hidden md:block text-sm text-gray-500">
                    <p>All sessions are conducted via Zoom</p>
                    <p>You'll receive a confirmation email with the link</p>
                  </div>
                </div>
                
                {bookingState.selectedTimeSlot ? (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 px-6 h-auto py-3" 
                    onClick={() => {
                      // Reopen confirmation dialog if time slot is already selected
                      setBookingState(prev => ({
                        ...prev,
                        isConfirmationOpen: true
                      }));
                      // Scroll to the time slots section
                      document.querySelector('.md\\:col-span-3')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Book {getSelectedTimeDisplay()}
                  </Button>
                ) : bookingState.selectedDate ? (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 px-6 h-auto py-3" 
                    onClick={() => {
                      // If a date is selected, scroll to the time slots section
                      document.querySelector('.md\\:col-span-3')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {bookingState.timeSlots && bookingState.timeSlots.some(slot => slot.available) ? (
                      <>Choose a Time Slot</>
                    ) : (
                      <>No Available Slots</>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 px-6 h-auto py-3" 
                    onClick={() => {
                      // If no date is selected, scroll to the calendar section
                      document.querySelector('.md\\:col-span-5')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Select a Date
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add bottom padding to prevent content from being hidden behind sticky footer */}
        <div className="pb-24"></div>
      </main>
    </div>
  );
} 