import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfDay, isEqual, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../auth/AuthContext';
import { getUserSchedule } from '../../services/availability';
import type { WeeklySchedule } from '../../types/availability';

interface CalendarProps {
  onTimeSlotSelect: (startTime: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onTimeSlotSelect }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvailability = async () => {
      if (user) {
        try {
          const schedule = await getUserSchedule(user.uid);
          console.log('Loaded availability:', schedule);
          setAvailability(schedule);
        } catch (error) {
          console.error('Error loading availability:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadAvailability();
  }, [user]);

  const isTimeSlotAvailable = (time: string): boolean => {
    if (!availability) {
      console.log('No availability data');
      return false;
    }

    const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase();
    console.log('Checking availability for:', dayOfWeek, time);
    console.log('Day schedule:', availability[dayOfWeek]);

    const daySchedule = availability[dayOfWeek];

    if (!daySchedule?.enabled) {
      console.log('Day not enabled');
      return false;
    }

    // Convert time slot to minutes for comparison
    const [hours, minutes] = time.split(':').map(Number);
    const slotTimeInMinutes = hours * 60 + minutes;

    // Check if the time slot falls within any of the available ranges
    const isAvailable = daySchedule.timeRanges.some(range => {
      const [startHours, startMinutes] = range.start.split(':').map(Number);
      const [endHours, endMinutes] = range.end.split(':').map(Number);

      const rangeStartMinutes = startHours * 60 + startMinutes;
      const rangeEndMinutes = endHours * 60 + endMinutes;

      const withinRange = slotTimeInMinutes >= rangeStartMinutes && slotTimeInMinutes < rangeEndMinutes;
      console.log(`Checking slot ${time} against range ${range.start}-${range.end}: ${withinRange}`);
      return withinRange;
    });

    return isAvailable;
  };

  // Generate time slots based on availability
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time,
          available: isTimeSlotAvailable(time)
        });
      }
    }
    return slots;
  };

  const generateWeekDays = () => {
    const start = startOfWeek(currentMonth);
    return Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(start, index);
      return {
        date: day,
        dayName: format(day, 'EEE'),
        dayNumber: format(day, 'd'),
        isToday: isEqual(startOfDay(day), startOfDay(new Date()))
      };
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Month and Navigation */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center"
        >
          <span className="text-blue-500">←</span>
          <span className="ml-1">Prev</span>
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center"
        >
          <span className="mr-1">Next</span>
          <span className="text-blue-500">→</span>
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-4 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-gray-500 text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-4 mb-8">
        {generateWeekDays().map((day) => (
          <div
            key={day.date.toISOString()}
            onClick={() => setSelectedDate(day.date)}
            className={`
              cursor-pointer rounded-xl p-4 text-center transition-all duration-300 ease-in-out
              transform hover:scale-105 hover:shadow-md
              ${isEqual(selectedDate, day.date)
                ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300'
                : day.isToday
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-gray-50 hover:bg-gray-100'}
            `}
          >
            <div className="text-sm font-medium mb-1">{day.dayName}</div>
            <div className="text-lg font-bold">{day.dayNumber}</div>
          </div>
        ))}
      </div>

      {/* Selected Date Display */}
      <div className="text-center text-gray-600 font-medium mb-6">
        <span className="inline-block bg-gray-50 px-4 py-2 rounded-full">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </span>
      </div>

      {/* Time Slots */}
      <div className="grid grid-cols-3 gap-3">
        {generateTimeSlots().map(({ time, available }) => (
          <button
            key={time}
            onClick={() => {
              if (available) {
                const [hours, minutes] = time.split(':').map(Number);
                const selectedDateTime = new Date(selectedDate);
                selectedDateTime.setHours(hours, minutes, 0, 0);
                onTimeSlotSelect(selectedDateTime);
              }
            }}
            disabled={!available}
            className={`
              py-3 px-4 rounded-lg text-center transition-all duration-200
              ${available 
                ? 'bg-white hover:bg-green-50 hover:shadow-md transform hover:scale-105 text-gray-700 border border-gray-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
          >
            {format(new Date().setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1])), 'h:mm a')}
          </button>
        ))}
      </div>
    </div>
  );
};