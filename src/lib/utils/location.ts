/**
 * Location utilities for Epic A privacy-focused geolocation
 */

export interface LocationData {
  city: string;
  state: string;
  country: string;
  country_iso: string;
}

/**
 * Mock IP geolocation - in production this would use a real service
 * Returns coarse location data only (City/State/Country)
 */
export async function mockGeolocateIP(): Promise<LocationData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock locations for development
  const mockLocations: LocationData[] = [
    { city: "New York", state: "New York", country: "United States", country_iso: "US" },
    { city: "Los Angeles", state: "California", country: "United States", country_iso: "US" },
    { city: "London", state: "England", country: "United Kingdom", country_iso: "GB" },
    { city: "Toronto", state: "Ontario", country: "Canada", country_iso: "CA" },
    { city: "Sydney", state: "New South Wales", country: "Australia", country_iso: "AU" },
  ];

  return mockLocations[Math.floor(Math.random() * mockLocations.length)];
}

/**
 * Validates location data structure
 */
export function validateLocationData(location: Partial<LocationData>): boolean {
  return !!(
    location.city && 
    location.state && 
    location.country && 
    location.country_iso &&
    location.country_iso.length === 2
  );
}

/**
 * Common country ISO codes for form dropdown
 */
export const COUNTRY_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
];