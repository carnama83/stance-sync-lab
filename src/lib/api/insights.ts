import { supabase } from "@/integrations/supabase/client";

export interface InlineInsight {
  question_id: string;
  region_level: 'city' | 'state' | 'country' | 'global';
  region_key?: string | null;
  sample_size: number;
  distribution: Record<string, number>;
  updated_at: string;
  cached: boolean;
}

export async function getInline(params: {
  questionId: string;
  regionLevel: 'city' | 'state' | 'country' | 'global';
  regionKey?: string;
}): Promise<InlineInsight> {
  const searchParams = new URLSearchParams({
    question_id: params.questionId,
    region_level: params.regionLevel,
  });

  if (params.regionKey) {
    searchParams.append('region_key', params.regionKey);
  }

  const { data, error } = await supabase.functions.invoke('insights/inline', {
    method: 'GET',
    body: null, // GET request with query params
    // Use raw fetch since we need query params
  });

  // Use direct fetch for GET with query params
  const response = await fetch(
    `https://nkolvdetonkcjtylodol.supabase.co/functions/v1/insights/inline?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to get inline insights');
  }

  const result = await response.json();
  return result as InlineInsight;
}

export async function refreshInline(params: {
  questionId: string;
  regionLevel: 'city' | 'state' | 'country' | 'global';
  regionKey?: string;
}): Promise<{ success: boolean; refreshed: boolean }> {
  const { data, error } = await supabase.functions.invoke('insights/refresh', {
    method: 'POST',
    body: {
      question_id: params.questionId,
      region_level: params.regionLevel,
      region_key: params.regionKey || null,
    },
    headers: {
      'X-DEV-KEY': import.meta.env.VITE_DEV_KEY || '',
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to refresh insights');
  }

  return data;
}