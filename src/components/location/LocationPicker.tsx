import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/safe-select';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface LocationValue {
  countryIso?: string;
  regionId?: string;
  countyId?: string | null;
  cityId?: string | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  required?: boolean;
}

interface Country {
  iso2: string;
  name: string;
  emoji?: string;
}

interface Region {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface County {
  id: string;
  name: string;
  fips_code?: string;
}

interface City {
  id: string;
  name: string;
  population?: number;
}

export default function LocationPicker({ value, onChange, required = false }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCounties, setLoadingCounties] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load regions when country changes
  useEffect(() => {
    if (value.countryIso) {
      loadRegions(value.countryIso);
    } else {
      setRegions([]);
      setCounties([]);
      setCities([]);
    }
  }, [value.countryIso]);

  // Load counties and cities when region changes
  useEffect(() => {
    if (value.regionId) {
      loadCounties(value.regionId);
      loadCities(value.regionId);
    } else {
      setCounties([]);
      setCities([]);
    }
  }, [value.regionId]);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('countries_list');
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast({
        title: "Error",
        description: "Failed to load countries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async (countryIso: string) => {
    setLoadingRegions(true);
    try {
      const { data, error } = await supabase.rpc('regions_by_country', { p_iso2: countryIso });
      if (error) throw error;
      setRegions(data || []);
      
      // Reset region-dependent values if current region is not in new list
      if (value.regionId && !data?.some(r => r.id === value.regionId)) {
        onChange({
          ...value,
          regionId: undefined,
          countyId: null,
          cityId: null
        });
      }
    } catch (error) {
      console.error('Error loading regions:', error);
      toast({
        title: "Error",
        description: "Failed to load regions",
        variant: "destructive"
      });
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadCounties = async (regionId: string) => {
    setLoadingCounties(true);
    try {
      const { data, error } = await supabase.rpc('counties_by_region', { p_region: regionId });
      if (error) throw error;
      setCounties(data || []);
      
      // Reset county if current county is not in new list
      if (value.countyId && !data?.some(c => c.id === value.countyId)) {
        onChange({
          ...value,
          countyId: null
        });
      }
    } catch (error) {
      console.error('Error loading counties:', error);
      toast({
        title: "Error",
        description: "Failed to load counties",
        variant: "destructive"
      });
    } finally {
      setLoadingCounties(false);
    }
  };

  const loadCities = async (regionId: string) => {
    setLoadingCities(true);
    try {
      const { data, error } = await supabase.rpc('cities_by_region', { p_region: regionId });
      if (error) throw error;
      setCities(data || []);
      
      // Reset city if current city is not in new list
      if (value.cityId && !data?.some(c => c.id === value.cityId)) {
        onChange({
          ...value,
          cityId: null
        });
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      toast({
        title: "Error",
        description: "Failed to load cities",
        variant: "destructive"
      });
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCountryChange = (countryIso: string) => {
    onChange({
      countryIso,
      regionId: undefined,
      countyId: null,
      cityId: null
    });
  };

  const handleRegionChange = (regionId: string) => {
    onChange({
      ...value,
      regionId,
      countyId: null,
      cityId: null
    });
  };

  const handleCountyChange = (countyId: string | null) => {
    onChange({
      ...value,
      countyId: countyId === "none" ? null : countyId
    });
  };

  const handleCityChange = (cityId: string | null) => {
    onChange({
      ...value,
      cityId
    });
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading countries...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">
          Country {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={value.countryIso || ''} onValueChange={handleCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map(country => (
              <SelectItem key={country.iso2} value={country.iso2}>
                {country.emoji ? `${country.emoji} ` : ''}{country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region/State */}
      <div className="space-y-2">
        <Label htmlFor="region">
          Region/State {required && <span className="text-destructive">*</span>}
        </Label>
        <Select 
          value={value.regionId || ''} 
          onValueChange={handleRegionChange}
          disabled={!value.countryIso || loadingRegions}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingRegions ? "Loading regions..." : "Select region/state"} />
          </SelectTrigger>
          <SelectContent>
            {regions.map(region => (
              <SelectItem key={region.id} value={region.id}>
                {region.name} ({region.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* County (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="county">County (Optional)</Label>
        <Select 
          value={value.countyId || 'none'} 
          onValueChange={(val) => handleCountyChange(val || null)}
          disabled={!value.regionId || loadingCounties}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCounties ? "Loading counties..." : "Select county (optional)"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No county selected</SelectItem>
            {counties.map(county => (
              <SelectItem key={county.id} value={county.id}>
                {county.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">
          City {required && <span className="text-destructive">*</span>}
        </Label>
        <Select 
          value={value.cityId || ''} 
          onValueChange={(val) => handleCityChange(val || null)}
          disabled={!value.regionId || loadingCities}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select city"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map(city => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
                {city.population && ` (${city.population.toLocaleString()})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}