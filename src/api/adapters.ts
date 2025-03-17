import { format, parse, isValid } from 'date-fns';
import { Researcher, TimeSlot } from './models';

/**
 * Converts an availability time string (e.g., "09:00-10:00") to start and end Date objects
 * for a specific date
 */
export function parseTimeSlot(
  dateStr: string,
  timeRangeStr: string
): { startTime: Date; endTime: Date } | null {
  try {
    const [startTimeStr, endTimeStr] = timeRangeStr.split('-');
    const datePart = format(new Date(dateStr), 'yyyy-MM-dd');
    
    const startTime = parse(`${datePart} ${startTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
    const endTime = parse(`${datePart} ${endTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
    
    if (!isValid(startTime) || !isValid(endTime)) {
      return null;
    }
    
    return { startTime, endTime };
  } catch (error) {
    console.error('Error parsing time slot:', error);
    return null;
  }
}

/**
 * Converts backend researcher availability for a specific date to frontend TimeSlot array
 */
export function availabilityToTimeSlots(
  researcherId: string,
  availability: Researcher['availability'],
  date: Date
): TimeSlot[] {
  // Get the day of week in lowercase (e.g., "monday")
  const dayOfWeek = format(date, 'EEEE').toLowerCase();
  const formattedDate = format(date, 'yyyy-MM-dd');
  
  // Get the time slots for the day
  const timeRanges = availability[dayOfWeek] || [];
  
  // Convert each time range to a TimeSlot object
  return timeRanges
    .map((timeRange, index) => {
      const parsedTimes = parseTimeSlot(formattedDate, timeRange);
      
      if (!parsedTimes) return null;
      
      return {
        id: `${researcherId}-${formattedDate}-${index}`,
        researcher_id: researcherId,
        start_time: parsedTimes.startTime.toISOString(),
        end_time: parsedTimes.endTime.toISOString(),
        available: true
      };
    })
    .filter(Boolean) as TimeSlot[];
}

/**
 * Format time for display (e.g., "9:00 AM")
 */
export function formatTimeForDisplay(isoTimeString: string): string {
  try {
    const date = new Date(isoTimeString);
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return 'Invalid time';
  }
}

/**
 * Creates a session request object from a time slot and additional data
 */
export function createSessionRequestFromTimeSlot(
  timeSlot: TimeSlot,
  paperId?: string,
  questions?: string
) {
  return {
    researcher_id: timeSlot.researcher_id,
    paper_id: paperId,
    start_time: timeSlot.start_time,
    end_time: timeSlot.end_time,
    questions
  };
} 