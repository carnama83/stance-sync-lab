import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/safe-select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Settings } from 'lucide-react';
import { 
  triggerAggregation,
  histogramToDistribution 
} from '@/features/analytics/aggregates';

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

interface City {
  id: string;
  name: string;
  population?: number;
}

const CommunityPulse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showDevControls, setShowDevControls] = useState(false);
  const [devKey, setDevKey] = useState('');
  const [aggregating, setAggregating] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d'>('7d');
  
  // Location selection state
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  // Pulse data
  const [pulseData, setPulseData] = useState<any>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadRegions(selectedCountry);
    } else {
      setRegions([]);
      setCities([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedRegion) {
      loadCities(selectedRegion);
    } else {
      setCities([]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    loadPulseData();
  }, [selectedCountry, selectedRegion, selectedCity]);

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase.rpc('countries_list');
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadRegions = async (countryIso: string) => {
    try {
      const { data, error } = await supabase.rpc('regions_by_country', { p_iso2: countryIso });
      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const loadCities = async (regionId: string) => {
    try {
      const { data, error } = await supabase.rpc('cities_by_region', { p_region: regionId });
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadPulseData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('question_region_agg').select('*');
      
      if (selectedCity) {
        query = query.eq('geo_scope', 'city').eq('city_id', selectedCity);
      } else if (selectedRegion) {
        query = query.eq('geo_scope', 'region').eq('region_id', selectedRegion);
      } else if (selectedCountry) {
        query = query.eq('geo_scope', 'country').eq('country_iso', selectedCountry);
      } else {
        query = query.eq('geo_scope', 'global');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process aggregated data to create pulse statistics
      if (data && data.length > 0) {
        const totalResponses = data.reduce((sum, item) => sum + item.cnt, 0);
        const bucketDistribution = data.reduce((acc, item) => {
          acc[item.bucket] = item.cnt;
          return acc;
        }, {} as Record<number, number>);

        // Create distribution data for chart
        const distribution = [];
        for (let i = -2; i <= 2; i++) {
          const count = bucketDistribution[i] || 0;
          const label = i === -2 ? 'Strongly Against' : 
                       i === -1 ? 'Against' : 
                       i === 0 ? 'Neutral' : 
                       i === 1 ? 'For' : 'Strongly For';
          distribution.push({ label, count, score: i });
        }

        setPulseData({
          totalSampleSize: totalResponses,
          distribution,
          confidence: totalResponses > 100 ? 'high' : totalResponses > 25 ? 'medium' : 'low',
          weeklyChange: 0, // Would need time-series data to calculate
          monthlyChange: 0, // Would need time-series data to calculate
          trendData: [] // Would need historical data
        });
      } else {
        setPulseData(null);
      }
    } catch (error) {
      console.error('Error loading pulse data:', error);
      toast({
        title: "Error",
        description: "Failed to load community pulse data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAggregation = async () => {
    if (!devKey.trim()) {
      toast({
        title: "Dev Key Required",
        description: "Please enter a valid dev key",
        variant: "destructive"
      });
      return;
    }

    setAggregating(true);
    try {
      const result = await triggerAggregation(devKey);
      if (result.success) {
        toast({
          title: "Aggregation Complete",
          description: result.message,
        });
        await loadPulseData(); // Refresh data
      } else {
        toast({
          title: "Aggregation Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger aggregation",
        variant: "destructive"
      });
    } finally {
      setAggregating(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatPercentage = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${absValue.toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      default: return 'outline';
    }
  };

  const getScopeLabel = () => {
    if (selectedCity) return 'City';
    if (selectedRegion) return 'Region';
    if (selectedCountry) return 'Country';
    return 'Global';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading community pulse...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
            aria-label="Go back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Community Pulse</h1>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDevControls(!showDevControls)}
          aria-label="Toggle developer controls"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Dev Controls */}
      {showDevControls && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm">Developer Controls</CardTitle>
            <CardDescription>
              Trigger manual aggregation for testing purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="devKey">Dev Key</Label>
              <Input
                id="devKey"
                type="password"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
                placeholder="Enter dev key..."
              />
            </div>
            <Button 
              onClick={handleTriggerAggregation}
              disabled={aggregating}
              size="sm"
            >
              {aggregating ? 'Aggregating...' : 'Trigger Aggregation'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Region Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Region Selection</CardTitle>
          <CardDescription>
            Choose the geographic scope for community data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={selectedCountry || 'global'} onValueChange={(v) => setSelectedCountry(v === 'global' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country.iso2} value={country.iso2}>
                      {country.emoji ? `${country.emoji} ` : ''}{country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label>Region/State</Label>
              <Select value={selectedRegion || 'all'} onValueChange={(v) => setSelectedRegion(v === 'all' ? '' : v)} disabled={!selectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({region.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={selectedCity || 'all'} onValueChange={(v) => setSelectedCity(v === 'all' ? '' : v)} disabled={!selectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
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
        </CardContent>
      </Card>

      {!pulseData || pulseData.totalSampleSize === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No community data available for the selected region. Try a broader scope or check back later.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sample Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pulseData.totalSampleSize}</div>
                <Badge 
                  variant={getConfidenceColor(pulseData.confidence)}
                  className="mt-2"
                >
                  {pulseData.confidence} confidence
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  7-Day Trend
                  {getTrendIcon(pulseData.weeklyChange)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(pulseData.weeklyChange)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs previous week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  30-Day Trend
                  {getTrendIcon(pulseData.monthlyChange)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(pulseData.monthlyChange)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs previous month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getScopeLabel()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current region
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Opinion Distribution</CardTitle>
              <CardDescription>
                How the community is distributed across stance scores (-2 to +2)
                {pulseData.confidence === 'low' && (
                  <span className="text-amber-600 ml-2">(Low sample size - interpret with caution)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full" role="img" aria-label="Bar chart showing distribution of community opinions">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pulseData.distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} responses`, 'Count']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Distribution shows aggregated responses across all recent questions. Sample size: {pulseData.totalSampleSize}
              </div>
            </CardContent>
          </Card>

          {/* Trend Chart - Show placeholder when no trend data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Macro Trends
                <div className="flex gap-2">
                  <Button
                    variant={trendPeriod === '7d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTrendPeriod('7d')}
                  >
                    7 Days
                  </Button>
                  <Button
                    variant={trendPeriod === '30d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTrendPeriod('30d')}
                  >
                    30 Days
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Average community sentiment over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full flex items-center justify-center bg-muted/30 rounded">
                <p className="text-muted-foreground">
                  Trend data will be available once more historical data is collected
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CommunityPulse;