import { supabase } from '@/integrations/supabase/client';

export type RegionScope = 'global' | 'country' | 'state' | 'city';

export interface Histogram {
  "-2": number;
  "-1": number;
  "0": number;
  "1": number;
  "2": number;
}

export interface AggregateData {
  id: string;
  day: string;
  question_id: string;
  scope: RegionScope;
  city?: string;
  state?: string;
  country_iso?: string;
  histogram: Histogram;
  sample_size: number;
  created_at: string;
}

export interface TrendData {
  date: string;
  avgScore: number;
  sampleSize: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Fetch aggregated data for a specific region scope
 */
export async function getAggregateData(
  scope: RegionScope,
  city?: string,
  state?: string,
  country_iso?: string,
  questionId?: string
): Promise<AggregateData[]> {
  let query = supabase
    .from('agg_question_region_daily')
    .select('*')
    .eq('scope', scope)
    .order('day', { ascending: false })
    .limit(30); // Last 30 days

  if (questionId) {
    query = query.eq('question_id', questionId);
  }

  if (scope === 'city' && city && country_iso) {
    query = query.eq('city', city).eq('country_iso', country_iso);
    if (state) query = query.eq('state', state);
  } else if (scope === 'state' && state && country_iso) {
    query = query.eq('state', state).eq('country_iso', country_iso);
  } else if (scope === 'country' && country_iso) {
    query = query.eq('country_iso', country_iso);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching aggregate data:', error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    scope: item.scope as RegionScope,
    histogram: item.histogram as unknown as Histogram
  }));
}

/**
 * Convert histogram to distribution chart data
 */
export function histogramToDistribution(histogram: Histogram) {
  return [
    { score: -2, label: 'Strongly Disagree', count: histogram['-2'] },
    { score: -1, label: 'Disagree', count: histogram['-1'] },
    { score: 0, label: 'Neutral', count: histogram['0'] },
    { score: 1, label: 'Agree', count: histogram['1'] },
    { score: 2, label: 'Strongly Agree', count: histogram['2'] }
  ];
}

/**
 * Calculate average score from histogram
 */
export function calculateAverageScore(histogram: Histogram): number {
  const totalResponses = Object.values(histogram).reduce((sum, count) => sum + count, 0);
  if (totalResponses === 0) return 0;

  const weightedSum = 
    histogram['-2'] * -2 +
    histogram['-1'] * -1 +
    histogram['0'] * 0 +
    histogram['1'] * 1 +
    histogram['2'] * 2;

  return weightedSum / totalResponses;
}

/**
 * Determine confidence level based on sample size
 */
export function getConfidenceLevel(sampleSize: number): 'high' | 'medium' | 'low' {
  if (sampleSize >= 100) return 'high';
  if (sampleSize >= 30) return 'medium';
  return 'low';
}

/**
 * Transform aggregate data to trend data for charts
 */
export function transformToTrendData(aggregates: AggregateData[]): TrendData[] {
  return aggregates
    .map(agg => ({
      date: agg.day,
      avgScore: calculateAverageScore(agg.histogram),
      sampleSize: agg.sample_size,
      confidence: getConfidenceLevel(agg.sample_size)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate percentage change in average scores over periods
 */
export function calculateTrendChange(trendData: TrendData[], days: number): number {
  if (trendData.length < 2) return 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  const recent = trendData.filter(d => d.date >= cutoffStr);
  const previous = trendData.filter(d => d.date < cutoffStr);

  if (recent.length === 0 || previous.length === 0) return 0;

  const recentAvg = recent.reduce((sum, d) => sum + d.avgScore, 0) / recent.length;
  const previousAvg = previous.reduce((sum, d) => sum + d.avgScore, 0) / previous.length;

  if (previousAvg === 0) return recentAvg === 0 ? 0 : 100;
  return ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100;
}

/**
 * Get community pulse data for dashboard
 */
export async function getCommunityPulseData(
  scope: RegionScope,
  city?: string,
  state?: string,
  country_iso?: string
) {
  const aggregates = await getAggregateData(scope, city, state, country_iso);
  const trendData = transformToTrendData(aggregates);
  
  // Get latest distribution for current period
  const latestAggregate = aggregates[0];
  const distribution = latestAggregate ? histogramToDistribution(latestAggregate.histogram) : [];
  
  return {
    distribution,
    trendData,
    weeklyChange: calculateTrendChange(trendData, 7),
    monthlyChange: calculateTrendChange(trendData, 30),
    totalSampleSize: latestAggregate?.sample_size || 0,
    confidence: latestAggregate ? getConfidenceLevel(latestAggregate.sample_size) : 'low'
  };
}

/**
 * Trigger manual aggregation (DEV only)
 */
export async function triggerAggregation(devKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('aggregate', {
      headers: { 'X-DEV-KEY': devKey }
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: `Aggregated ${data?.upserts || 0} records` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}