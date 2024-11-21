export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

export interface AvailabilitySettings {
  workingHours: {
    start: string; // "HH:mm" format
    end: string;
  };
  slotDuration: number; // in minutes
}