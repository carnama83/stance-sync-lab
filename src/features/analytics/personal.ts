import { supabase } from '@/integrations/supabase/client';

export interface StanceTimePoint {
  date: string;
  score: number;
  question_id: string;
  question_title?: string;
}

export interface PersonalAnalytics {
  stanceHistory: StanceTimePoint[];
  weeklyChange: number;
  monthlyChange: number;
  totalStances: number;
}

/**
 * Fetch user's stance history for personal analytics
 */
export async function getPersonalStanceHistory(): Promise<StanceTimePoint[]> {
  const { data: stances, error } = await supabase
    .from('stances')
    .select(`
      question_id,
      score,
      updated_at,
      questions (
        title
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching stance history:', error);
    return [];
  }

  return stances?.map(stance => ({
    date: stance.updated_at.split('T')[0], // YYYY-MM-DD format
    score: stance.score,
    question_id: stance.question_id,
    question_title: stance.questions?.title
  })) || [];
}

/**
 * Calculate percentage change between two periods
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Get stance changes compared to previous periods
 */
export function getStanceChanges(stanceHistory: StanceTimePoint[]): { 
  weeklyChange: number; 
  monthlyChange: number; 
} {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

  // Get average scores for different periods
  const recentWeek = stanceHistory.filter(s => 
    new Date(s.date) >= sevenDaysAgo
  );
  const previousWeek = stanceHistory.filter(s => 
    new Date(s.date) >= fourteenDaysAgo && new Date(s.date) < sevenDaysAgo
  );
  
  const recentMonth = stanceHistory.filter(s => 
    new Date(s.date) >= thirtyDaysAgo
  );
  const previousMonth = stanceHistory.filter(s => 
    new Date(s.date) >= sixtyDaysAgo && new Date(s.date) < thirtyDaysAgo
  );

  const avgRecentWeek = recentWeek.length > 0 
    ? recentWeek.reduce((sum, s) => sum + s.score, 0) / recentWeek.length 
    : 0;
  const avgPreviousWeek = previousWeek.length > 0 
    ? previousWeek.reduce((sum, s) => sum + s.score, 0) / previousWeek.length 
    : 0;

  const avgRecentMonth = recentMonth.length > 0 
    ? recentMonth.reduce((sum, s) => sum + s.score, 0) / recentMonth.length 
    : 0;
  const avgPreviousMonth = previousMonth.length > 0 
    ? previousMonth.reduce((sum, s) => sum + s.score, 0) / previousMonth.length 
    : 0;

  return {
    weeklyChange: calculatePercentageChange(avgRecentWeek, avgPreviousWeek),
    monthlyChange: calculatePercentageChange(avgRecentMonth, avgPreviousMonth)
  };
}

/**
 * Transform stance history for time series charts
 */
export function transformForTimeSeriesChart(stanceHistory: StanceTimePoint[]) {
  // Group by date and calculate average score per day
  const dailyScores = new Map<string, { scores: number[]; date: string }>();
  
  stanceHistory.forEach(stance => {
    if (!dailyScores.has(stance.date)) {
      dailyScores.set(stance.date, { scores: [], date: stance.date });
    }
    dailyScores.get(stance.date)!.scores.push(stance.score);
  });

  return Array.from(dailyScores.values())
    .map(day => ({
      date: day.date,
      score: day.scores.reduce((sum, score) => sum + score, 0) / day.scores.length,
      count: day.scores.length
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get complete personal analytics data
 */
export async function getPersonalAnalytics(): Promise<PersonalAnalytics> {
  const stanceHistory = await getPersonalStanceHistory();
  const changes = getStanceChanges(stanceHistory);
  
  return {
    stanceHistory,
    weeklyChange: changes.weeklyChange,
    monthlyChange: changes.monthlyChange,
    totalStances: stanceHistory.length
  };
}