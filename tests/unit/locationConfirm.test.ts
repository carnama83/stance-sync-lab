import { validateLocationData, mockGeolocateIP, type LocationData } from '@/lib/utils/location';

describe('Location Utilities', () => {
  describe('validateLocationData', () => {
    test('should accept valid location data', () => {
      const validLocation: LocationData = {
        city: 'New York',
        state: 'New York',
        country: 'United States',
        country_iso: 'US'
      };

      const result = validateLocationData(validLocation);
      expect(result).toBe(true);
    });

    test('should reject location data with missing fields', () => {
      const invalidLocations = [
        { city: '', state: 'NY', country: 'US', country_iso: 'US' },
        { city: 'NYC', state: '', country: 'US', country_iso: 'US' },
        { city: 'NYC', state: 'NY', country: '', country_iso: 'US' },
        { city: 'NYC', state: 'NY', country: 'US', country_iso: '' },
      ];

      invalidLocations.forEach(location => {
        const result = validateLocationData(location);
        expect(result).toBe(false);
      });
    });

    test('should reject location data with invalid country ISO code', () => {
      const invalidLocation = {
        city: 'NYC',
        state: 'NY', 
        country: 'United States',
        country_iso: 'USA' // Should be 2 characters
      };

      const result = validateLocationData(invalidLocation);
      expect(result).toBe(false);
    });

    test('should accept location with proper 2-letter ISO code', () => {
      const validLocations = [
        { city: 'London', state: 'England', country: 'UK', country_iso: 'GB' },
        { city: 'Toronto', state: 'Ontario', country: 'Canada', country_iso: 'CA' },
        { city: 'Sydney', state: 'NSW', country: 'Australia', country_iso: 'AU' },
      ];

      validLocations.forEach(location => {
        const result = validateLocationData(location);
        expect(result).toBe(true);
      });
    });
  });

  describe('mockGeolocateIP', () => {
    test('should return valid location data', async () => {
      const location = await mockGeolocateIP();
      
      expect(location).toHaveProperty('city');
      expect(location).toHaveProperty('state');
      expect(location).toHaveProperty('country');
      expect(location).toHaveProperty('country_iso');
      
      expect(location.city).toBeTruthy();
      expect(location.state).toBeTruthy();
      expect(location.country).toBeTruthy();
      expect(location.country_iso).toHaveLength(2);
      
      const isValid = validateLocationData(location);
      expect(isValid).toBe(true);
    });

    test('should return different locations on multiple calls', async () => {
      const locations = await Promise.all([
        mockGeolocateIP(),
        mockGeolocateIP(),
        mockGeolocateIP(),
        mockGeolocateIP(),
        mockGeolocateIP()
      ]);

      // With 5 different mock locations, we should get some variety
      const uniqueCities = new Set(locations.map(l => l.city));
      expect(uniqueCities.size).toBeGreaterThan(1);
    });

    test('should simulate realistic delay', async () => {
      const startTime = Date.now();
      await mockGeolocateIP();
      const endTime = Date.now();
      
      const delay = endTime - startTime;
      expect(delay).toBeGreaterThanOrEqual(500); // Should have at least 500ms delay
      expect(delay).toBeLessThan(1000); // But not too much more
    });
  });
});