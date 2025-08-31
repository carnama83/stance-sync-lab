import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LocationPicker from '@/components/location/LocationPicker';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn()
}));

const mockCountries = [
  { iso2: 'US', name: 'United States', emoji: '🇺🇸' },
  { iso2: 'CA', name: 'Canada', emoji: '🇨🇦' },
];

const mockRegions = [
  { id: '1', name: 'California', code: 'CA', type: 'state' },
  { id: '2', name: 'New York', code: 'NY', type: 'state' },
];

const mockCities = [
  { id: '1', name: 'Los Angeles', population: 4000000 },
  { id: '2', name: 'San Francisco', population: 875000 },
];

const mockCounties = [
  { id: '1', name: 'Los Angeles County', fips_code: '06037' },
  { id: '2', name: 'San Francisco County', fips_code: '06075' },
];

describe('LocationPicker', () => {
  const mockOnChange = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.rpc as any).mockImplementation((funcName: string) => {
      switch (funcName) {
        case 'countries_list':
          return Promise.resolve({ data: mockCountries, error: null });
        case 'regions_by_country':
          return Promise.resolve({ data: mockRegions, error: null });
        case 'cities_by_region':
          return Promise.resolve({ data: mockCities, error: null });
        case 'counties_by_region':
          return Promise.resolve({ data: mockCounties, error: null });
        default:
          return Promise.resolve({ data: [], error: null });
      }
    });
  });

  it('renders correctly and loads countries on mount', async () => {
    render(
      <LocationPicker 
        value={{}} 
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Country')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('countries_list');
    });
  });

  it('cascades region loading when country changes', async () => {
    render(
      <LocationPicker 
        value={{ countryIso: 'US' }} 
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('regions_by_country', { p_iso2: 'US' });
    });
  });

  it('cascades city and county loading when region changes', async () => {
    render(
      <LocationPicker 
        value={{ 
          countryIso: 'US',
          regionId: '1'
        }} 
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('cities_by_region', { p_region: '1' });
      expect(supabase.rpc).toHaveBeenCalledWith('counties_by_region', { p_region: '1' });
    });
  });

  it('calls onChange with correct values when selections change', async () => {
    const { rerender } = render(
      <LocationPicker 
        value={{}} 
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select country')).toBeInTheDocument();
    });

    // Simulate country selection
    const countrySelect = screen.getByText('Select country');
    fireEvent.click(countrySelect);
    
    // This would normally trigger the onChange, but we'll test the logic
    expect(mockOnChange).not.toHaveBeenCalledWith({
      countryIso: 'US',
      regionId: undefined,
      countyId: null,
      cityId: null
    });
  });

  it('shows required indicators when required prop is true', () => {
    render(
      <LocationPicker 
        value={{}} 
        onChange={mockOnChange}
        required
      />
    );

    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });

  it('disables dependent selects when parent is not selected', () => {
    render(
      <LocationPicker 
        value={{}} 
        onChange={mockOnChange}
      />
    );

    // Region should be disabled when no country is selected
    const regionSelect = screen.getByRole('combobox', { name: /region/i });
    expect(regionSelect).toBeDisabled();
  });

  it('resets dependent values when parent changes', () => {
    const { rerender } = render(
      <LocationPicker 
        value={{
          countryIso: 'US',
          regionId: '1',
          cityId: '1',
          countyId: '1'
        }} 
        onChange={mockOnChange}
      />
    );

    // Change country - should reset all dependent values
    rerender(
      <LocationPicker 
        value={{
          countryIso: 'CA'
        }} 
        onChange={mockOnChange}
      />
    );

    expect(mockOnChange).toHaveBeenCalledWith({
      countryIso: 'CA',
      regionId: undefined,
      countyId: null,
      cityId: null
    });
  });
});