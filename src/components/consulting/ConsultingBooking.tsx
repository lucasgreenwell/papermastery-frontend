import React, { useState, useEffect } from 'react';
import { 
  ResearcherSidebar, 
  Researcher 
} from './ResearcherSidebar';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import TimeSlotsList from './TimeSlotsList';
import { TimeSlot } from '@/api/models';
import { consultingApi } from '@/api/consulting-api';
import { availabilityToTimeSlots } from '@/api/adapters';
import { useToast } from '@/components/ui/use-toast';

interface ConsultingBookingProps {
  paperId?: string;
}

export const ConsultingBooking: React.FC<ConsultingBookingProps> = ({ paperId }) => {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[] | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Get researchers associated with the paper
  useEffect(() => {
    const fetchResearcher = async () => {
      if (!paperId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch researcher for this paper
        const researcher = await consultingApi.getResearcherByPaper(paperId);
        setResearchers([researcher]);
        setSelectedResearcher(researcher);
      } catch (err) {
        console.error('Error fetching researcher:', err);
        setError('Could not load researcher information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResearcher();
  }, [paperId]);
  
  // When researcher and date are selected, fetch time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedResearcher || !selectedDate) {
        setTimeSlots(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch time slots for the selected researcher and date
        const slots = await consultingApi.getAvailableTimeSlots(
          selectedResearcher.id,
          selectedDate
        );
        
        setTimeSlots(slots);
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setError('Could not load available time slots');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedResearcher, selectedDate]);
  
  // Handle researcher selection
  const handleResearcherSelect = (researcher: Researcher) => {
    setSelectedResearcher(researcher);
    setSelectedTimeSlot(null); // Reset selected time slot when researcher changes
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset selected time slot when date changes
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: TimeSlot | null) => {
    setSelectedTimeSlot(timeSlot);
  };
  
  // Handle booking confirmation
  const handleBookingConfirmed = async (timeSlotId: string, date: Date, questions?: string) => {
    if (!selectedTimeSlot || !selectedResearcher) return;
    
    try {
      // Create a booking session
      const sessionRequest = {
        researcher_id: selectedResearcher.id,
        paper_id: paperId,
        start_time: selectedTimeSlot.start_time,
        end_time: selectedTimeSlot.end_time,
        questions
      };
      
      // API call is now handled inside the TimeSlotsList component
      
      toast({
        title: "Success!",
        description: "Your session has been booked. You'll receive a confirmation email with details.",
      });
      
      // Reset UI state
      setSelectedTimeSlot(null);
      // Refresh time slots
      const slots = await consultingApi.getAvailableTimeSlots(
        selectedResearcher.id,
        selectedDate
      );
      setTimeSlots(slots);
      
    } catch (err) {
      console.error('Error confirming booking:', err);
      toast({
        title: "Booking Failed",
        description: "There was a problem booking your session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex flex-col lg:flex-row w-full gap-6">
      {/* Researcher sidebar */}
      <div className="w-full lg:w-1/3">
        <ResearcherSidebar 
          researchers={researchers}
          selectedResearcher={selectedResearcher}
          loading={loading && !researchers.length}
          onResearcherSelect={handleResearcherSelect}
        />
      </div>
      
      {/* Calendar and time slots */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2">
          <AvailabilityCalendar 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            disabled={!selectedResearcher}
          />
        </div>
        
        <div className="w-full lg:w-1/2">
          <TimeSlotsList 
            timeSlots={timeSlots}
            loading={loading && !!selectedDate && !!selectedResearcher}
            error={error}
            selectedDate={selectedDate}
            selectedResearcher={selectedResearcher}
            onBookingConfirmed={handleBookingConfirmed}
            onTimeSlotSelect={handleTimeSlotSelect}
            selectedTimeSlot={selectedTimeSlot}
            paperId={paperId}
          />
        </div>
      </div>
      
      {/* Footer with booking information - sticky at bottom */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md mt-auto">
        <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-3 sm:mb-0">
            {selectedResearcher && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Selected expert:</span> {selectedResearcher.name}
              </p>
            )}
            {selectedDate && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {selectedDate.toLocaleDateString()}
              </p>
            )}
          </div>
          
          {selectedTimeSlot && (
            <div className="flex gap-2">
              <p className="text-sm flex items-center bg-blue-50 text-blue-700 px-3 py-2 rounded-md">
                <span className="font-medium">Selected time:</span>&nbsp;
                {new Date(selectedTimeSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -&nbsp;
                {new Date(selectedTimeSlot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 