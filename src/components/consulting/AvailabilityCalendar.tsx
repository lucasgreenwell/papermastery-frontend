import React from 'react';
import { format, isSameDay, isWeekend, addMonths } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export interface DayAvailability {
  date: string;
  hasSlots: boolean;
}

interface AvailabilityCalendarProps {
  availabilityByDay: DayAvailability[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  loading?: boolean;
}

const AvailabilityCalendar = ({
  availabilityByDay,
  selectedDate,
  onSelectDate,
  loading = false
}: AvailabilityCalendarProps) => {
  // Helper to determine if a date has availability
  const hasAvailability = (date: Date): boolean => {
    return availabilityByDay.some(day => {
      const dayDate = new Date(day.date);
      return isSameDay(date, dayDate) && day.hasSlots;
    });
  };

  // Set the current month for the calendar
  const today = new Date();
  
  // Custom tile content to show availability indicator
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    // Show an indicator dot for dates with availability
    if (hasAvailability(date)) {
      return <div className="availability-dot"></div>;
    }
    return null;
  };
  
  // Custom class names for tiles
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';
    
    const classes = [];
    
    // Add class for dates with availability
    if (hasAvailability(date)) {
      classes.push('has-availability');
    }
    
    // Add class for today
    if (isSameDay(date, today)) {
      classes.push('today');
    }
    
    // Add class for past dates
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    if (compareDate < today) {
      classes.push('past-date');
    }
    
    return classes.join(' ');
  };
  
  // Disable tiles function
  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    // Disable dates in the past
    if (compareDate < today) {
      return true;
    }
    
    // Disable weekends if they're not in the availability list
    if (isWeekend(date) && !hasAvailability(date)) {
      return true;
    }
    
    // If we have availability data, check if this date has slots
    if (availabilityByDay.length > 0) {
      return !hasAvailability(date);
    }
    
    // If no availability data yet, don't disable dates
    return false;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <span>Available Dates</span>
        </CardTitle>
        <CardDescription>
          Select a date to view available time slots
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-6 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Loading availability...</p>
          </div>
        ) : availabilityByDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-center">
              Select a researcher to view their availability
            </p>
          </div>
        ) : (
          <div className="calendar-container w-full h-full flex items-center justify-center">
            <style dangerouslySetInnerHTML={{ __html: `
              .react-calendar {
                width: 100%;
                height: 100%;
                max-width: 100%;
                background: white;
                border: none;
                font-family: inherit;
                line-height: 1.5;
              }
              .react-calendar--doubleView {
                width: 100%;
              }
              .react-calendar button {
                margin: 0;
                border: 0;
                outline: none;
              }
              .react-calendar__navigation {
                display: flex;
                height: 44px;
                margin-bottom: 12px;
              }
              .react-calendar__navigation button {
                min-width: 44px;
                background: none;
                font-size: 16px;
                color: #1e293b;
                font-weight: 500;
              }
              .react-calendar__navigation button:disabled {
                background-color: transparent;
                opacity: 0.5;
              }
              .react-calendar__navigation button:enabled:hover,
              .react-calendar__navigation button:enabled:focus {
                background-color: #f0f9ff;
                border-radius: 8px;
              }
              .react-calendar__month-view__weekdays {
                text-align: center;
                text-transform: uppercase;
                font: inherit;
                font-size: 0.8em;
                font-weight: 600;
                padding: 8px 0;
                margin-bottom: 4px;
              }
              .react-calendar__month-view__weekdays__weekday {
                padding: 8px;
                color: #64748b;
              }
              .react-calendar__month-view__weekdays__weekday abbr {
                text-decoration: none;
              }
              .react-calendar__month-view__days {
                display: grid !important;
                grid-template-columns: repeat(7, 1fr);
                grid-template-rows: repeat(6, 1fr);
                flex: 1;
                min-height: 300px;
                gap: 4px;
              }
              .react-calendar__month-view__days__day {
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                font-size: 16px;
              }
              .react-calendar__month-view__days__day--weekend:not(.has-availability) {
                color: #94a3b8;
              }
              .react-calendar__month-view__days__day--neighboringMonth {
                color: #94a3b8;
              }
              .react-calendar__tile {
                max-width: 100%;
                padding: 12px 8px;
                background: none;
                text-align: center;
                border-radius: 8px;
                position: relative;
                transition: all 0.2s ease;
              }
              .react-calendar__tile:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                background-color: #f1f5f9;
              }
              .react-calendar__tile:enabled:hover,
              .react-calendar__tile:enabled:focus {
                background-color: #f1f5f9;
              }
              .react-calendar__tile--now {
                background-color: #e0f2fe;
                font-weight: 500;
              }
              .react-calendar__tile--active {
                background: #2563eb;
                color: white;
                font-weight: 500;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .react-calendar__tile--active:enabled:hover,
              .react-calendar__tile--active:enabled:focus {
                background: #1d4ed8;
              }
              .react-calendar__tile.has-availability {
                background-color: #f0fdf4;
                color: #15803d;
                font-weight: 500;
                border: 1px solid #dcfce7;
              }
              .react-calendar__tile.has-availability:enabled:hover,
              .react-calendar__tile.has-availability:enabled:focus {
                background-color: #dcfce7;
              }
              .react-calendar__tile.has-availability.react-calendar__tile--active {
                background: #2563eb;
                color: white;
                border: 1px solid #1d4ed8;
              }
              .availability-dot {
                position: absolute;
                bottom: 6px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                background-color: #15803d;
                border-radius: 50%;
              }
              .react-calendar__tile--active .availability-dot {
                background-color: white;
              }
            ` }} />
            <Calendar
              value={selectedDate}
              onChange={(date) => date instanceof Date && onSelectDate(date)}
              tileContent={tileContent}
              tileClassName={tileClassName}
              tileDisabled={tileDisabled}
              minDate={today}
              maxDate={addMonths(today, 3)}
              showNeighboringMonth={false}
              prev2Label={null}
              next2Label={null}
              className="w-full h-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar; 