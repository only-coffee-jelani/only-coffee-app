import { StoreHours } from '@shared/database/entities';

/**
 * Helper functions for store hours calculations with timezone support
 */

/**
 * Check if a store is currently open based on its hours and timezone
 * @param storeHours Array of store hours for each day of the week
 * @param timezone IANA timezone identifier (e.g., 'America/Chicago')
 * @returns boolean indicating if the store is currently open
 */
export function isStoreOpen(storeHours: StoreHours[], timezone: string): boolean {
  if (!storeHours || storeHours.length === 0) {
    return false;
  }

  try {
    // Get current time in the store's timezone
    const now = new Date();
    const storeTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = storeTime.getDay();
    
    // Find hours for current day
    const todayHours = storeHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!todayHours) {
      return false;
    }
    
    // Get current time in HH:MM:SS format
    const currentTime = storeTime.toTimeString().split(' ')[0]; // "HH:MM:SS"
    
    // Compare times (string comparison works for HH:MM:SS format)
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  } catch (error) {
    console.error('Error checking store hours:', error);
    return false;
  }
}

/**
 * Get formatted store hours for display
 * @param storeHours Array of store hours
 * @returns Object with day names as keys and formatted hours as values
 */
export function getFormattedStoreHours(storeHours: StoreHours[]): Record<string, string> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formatted: Record<string, string> = {};
  
  storeHours.forEach(hours => {
    const dayName = dayNames[hours.dayOfWeek];
    formatted[dayName] = `${formatTime(hours.openTime)} - ${formatTime(hours.closeTime)}`;
  });
  
  return formatted;
}

/**
 * Format time from HH:MM:SS to 12-hour format
 * @param time Time string in HH:MM:SS format
 * @returns Formatted time string (e.g., "6:00 AM")
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get current time in a specific timezone
 * @param timezone IANA timezone identifier
 * @returns Date object representing current time in that timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * Validate timezone string
 * @param timezone IANA timezone identifier
 * @returns boolean indicating if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get timezone offset in hours
 * @param timezone IANA timezone identifier
 * @returns Offset in hours (e.g., -6 for CST, -5 for EST)
 */
export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Get timezone abbreviation (e.g., CST, PST, EST)
 * @param timezone IANA timezone identifier
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbreviation(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  });
  const parts = formatter.formatToParts(now);
  const tzPart = parts.find(part => part.type === 'timeZoneName');
  return tzPart ? tzPart.value : timezone;
}

