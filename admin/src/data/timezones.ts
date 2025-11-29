/**
 * Comprehensive list of world timezones organized by region
 * IANA timezone database format
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export const WORLD_TIMEZONES: TimezoneOption[] = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time - New York, Toronto, Miami', offset: 'UTC-5/-4', region: 'North America' },
  { value: 'America/Chicago', label: 'Central Time - Chicago, Houston, Mexico City', offset: 'UTC-6/-5', region: 'North America' },
  { value: 'America/Denver', label: 'Mountain Time - Denver, Phoenix, Calgary', offset: 'UTC-7/-6', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'Pacific Time - Los Angeles, Seattle, Vancouver', offset: 'UTC-8/-7', region: 'North America' },
  { value: 'America/Anchorage', label: 'Alaska Time - Anchorage', offset: 'UTC-9/-8', region: 'North America' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time - Honolulu', offset: 'UTC-10', region: 'North America' },
  { value: 'America/Halifax', label: 'Atlantic Time - Halifax, Bermuda', offset: 'UTC-4/-3', region: 'North America' },
  { value: 'America/St_Johns', label: 'Newfoundland Time - St. Johns', offset: 'UTC-3:30/-2:30', region: 'North America' },
  
  // Central & South America
  { value: 'America/Sao_Paulo', label: 'Brasília Time - São Paulo, Rio de Janeiro', offset: 'UTC-3', region: 'South America' },
  { value: 'America/Buenos_Aires', label: 'Argentina Time - Buenos Aires', offset: 'UTC-3', region: 'South America' },
  { value: 'America/Santiago', label: 'Chile Time - Santiago', offset: 'UTC-4/-3', region: 'South America' },
  { value: 'America/Lima', label: 'Peru Time - Lima', offset: 'UTC-5', region: 'South America' },
  { value: 'America/Bogota', label: 'Colombia Time - Bogotá', offset: 'UTC-5', region: 'South America' },
  { value: 'America/Caracas', label: 'Venezuela Time - Caracas', offset: 'UTC-4', region: 'South America' },
  
  // Europe
  { value: 'Europe/London', label: 'GMT/BST - London, Dublin, Lisbon', offset: 'UTC+0/+1', region: 'Europe' },
  { value: 'Europe/Paris', label: 'CET/CEST - Paris, Berlin, Rome, Madrid', offset: 'UTC+1/+2', region: 'Europe' },
  { value: 'Europe/Athens', label: 'EET/EEST - Athens, Helsinki, Bucharest', offset: 'UTC+2/+3', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow Time - Moscow, St. Petersburg', offset: 'UTC+3', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Turkey Time - Istanbul', offset: 'UTC+3', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Central European - Zurich, Vienna', offset: 'UTC+1/+2', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Central European - Amsterdam, Brussels', offset: 'UTC+1/+2', region: 'Europe' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Time - Dubai, Abu Dhabi', offset: 'UTC+4', region: 'Asia' },
  { value: 'Asia/Karachi', label: 'Pakistan Time - Karachi, Islamabad', offset: 'UTC+5', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India Time - Mumbai, Delhi, Bangalore', offset: 'UTC+5:30', region: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Time - Dhaka', offset: 'UTC+6', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Indochina Time - Bangkok, Hanoi, Jakarta', offset: 'UTC+7', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore Time - Singapore, Kuala Lumpur', offset: 'UTC+8', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time - Hong Kong', offset: 'UTC+8', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'China Time - Beijing, Shanghai, Taipei', offset: 'UTC+8', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Japan Time - Tokyo, Osaka, Seoul', offset: 'UTC+9', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Korea Time - Seoul', offset: 'UTC+9', region: 'Asia' },
  { value: 'Asia/Manila', label: 'Philippines Time - Manila', offset: 'UTC+8', region: 'Asia' },
  { value: 'Asia/Jerusalem', label: 'Israel Time - Jerusalem, Tel Aviv', offset: 'UTC+2/+3', region: 'Asia' },
  { value: 'Asia/Riyadh', label: 'Arabia Time - Riyadh, Kuwait', offset: 'UTC+3', region: 'Asia' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Egypt Time - Cairo', offset: 'UTC+2', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'South Africa Time - Johannesburg, Cape Town', offset: 'UTC+2', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'West Africa Time - Lagos, Accra', offset: 'UTC+1', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'East Africa Time - Nairobi, Addis Ababa', offset: 'UTC+3', region: 'Africa' },
  { value: 'Africa/Casablanca', label: 'Morocco Time - Casablanca', offset: 'UTC+0/+1', region: 'Africa' },
  
  // Oceania
  { value: 'Australia/Sydney', label: 'Australian Eastern - Sydney, Melbourne', offset: 'UTC+10/+11', region: 'Oceania' },
  { value: 'Australia/Perth', label: 'Australian Western - Perth', offset: 'UTC+8', region: 'Oceania' },
  { value: 'Australia/Adelaide', label: 'Australian Central - Adelaide', offset: 'UTC+9:30/+10:30', region: 'Oceania' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time - Auckland, Wellington', offset: 'UTC+12/+13', region: 'Oceania' },
  { value: 'Pacific/Fiji', label: 'Fiji Time - Suva', offset: 'UTC+12/+13', region: 'Oceania' },
  { value: 'Pacific/Guam', label: 'Chamorro Time - Guam', offset: 'UTC+10', region: 'Oceania' },
  
  // Atlantic
  { value: 'Atlantic/Reykjavik', label: 'Iceland Time - Reykjavik', offset: 'UTC+0', region: 'Atlantic' },
  { value: 'Atlantic/Azores', label: 'Azores Time - Ponta Delgada', offset: 'UTC-1/+0', region: 'Atlantic' },
  { value: 'Atlantic/Cape_Verde', label: 'Cape Verde Time', offset: 'UTC-1', region: 'Atlantic' },
];

/**
 * Get timezones grouped by region
 */
export function getTimezonesByRegion(): Record<string, TimezoneOption[]> {
  const grouped: Record<string, TimezoneOption[]> = {};
  
  WORLD_TIMEZONES.forEach(tz => {
    if (!grouped[tz.region]) {
      grouped[tz.region] = [];
    }
    grouped[tz.region].push(tz);
  });
  
  return grouped;
}

/**
 * Get timezone by value
 */
export function getTimezoneByValue(value: string): TimezoneOption | undefined {
  return WORLD_TIMEZONES.find(tz => tz.value === value);
}

/**
 * Search timezones by query
 */
export function searchTimezones(query: string): TimezoneOption[] {
  const lowerQuery = query.toLowerCase();
  return WORLD_TIMEZONES.filter(tz => 
    tz.label.toLowerCase().includes(lowerQuery) ||
    tz.value.toLowerCase().includes(lowerQuery) ||
    tz.region.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get popular timezones (most commonly used)
 */
export const POPULAR_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
];

/**
 * Get timezone display name with offset
 */
export function getTimezoneDisplayName(value: string): string {
  const tz = getTimezoneByValue(value);
  if (!tz) return value;
  return `${tz.label} (${tz.offset})`;
}

