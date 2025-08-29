import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface InlineParams {
  question_id: string;
  region_level: 'city' | 'state' | 'country' | 'global';
  region_key?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Service client for cache writes
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Regular client for reads
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    if (path === '/inline' && req.method === 'GET') {
      const questionId = url.searchParams.get('question_id');
      const regionLevel = url.searchParams.get('region_level') as 'city' | 'state' | 'country' | 'global';
      const regionKey = url.searchParams.get('region_key') || null;

      if (!questionId || !regionLevel) {
        return new Response(
          JSON.stringify({ error: 'question_id and region_level required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check cache first
      const { data: cached, error: cacheError } = await supabase
        .from('inline_insights_cache')
        .select('*')
        .eq('question_id', questionId)
        .eq('region_level', regionLevel)
        .eq('region_key', regionKey)
        .maybeSingle();

      if (cacheError) throw cacheError;

      const now = new Date();
      const cacheExpiry = 60 * 1000; // 60 seconds

      // Return cached if fresh
      if (cached && (now.getTime() - new Date(cached.updated_at).getTime()) < cacheExpiry) {
        return new Response(
          JSON.stringify({
            question_id: questionId,
            region_level: regionLevel,
            region_key: regionKey,
            sample_size: cached.sample_size,
            distribution: cached.dist,
            updated_at: cached.updated_at,
            cached: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Recompute distribution
      const distribution = await computeDistribution(supabase, questionId, regionLevel, regionKey);

      // Update cache using service role
      const { error: upsertError } = await adminSupabase
        .from('inline_insights_cache')
        .upsert({
          question_id: questionId,
          region_level: regionLevel,
          region_key: regionKey,
          sample_size: distribution.sample_size,
          dist: distribution.dist,
          updated_at: now.toISOString(),
        });

      if (upsertError) {
        console.error('Cache upsert error:', upsertError);
        // Continue even if cache fails
      }

      return new Response(
        JSON.stringify({
          question_id: questionId,
          region_level: regionLevel,
          region_key: regionKey,
          sample_size: distribution.sample_size,
          distribution: distribution.dist,
          updated_at: now.toISOString(),
          cached: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/refresh' && req.method === 'POST') {
      const devKey = req.headers.get('X-DEV-KEY');
      const expectedDevKey = Deno.env.get('DEV_DEVKEY');
      if (!expectedDevKey || devKey !== expectedDevKey) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - admin/dev only' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { question_id, region_level, region_key }: InlineParams = await req.json();

      if (!question_id || !region_level) {
        return new Response(
          JSON.stringify({ error: 'question_id and region_level required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const distribution = await computeDistribution(supabase, question_id, region_level, region_key);

      const { error: upsertError } = await adminSupabase
        .from('inline_insights_cache')
        .upsert({
          question_id,
          region_level,
          region_key: region_key || null,
          sample_size: distribution.sample_size,
          dist: distribution.dist,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      return new Response(
        JSON.stringify({ success: true, refreshed: true, ...distribution }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Insights function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function computeDistribution(
  supabase: any, 
  questionId: string, 
  regionLevel: 'city' | 'state' | 'country' | 'global', 
  regionKey?: string | null
): Promise<{ sample_size: number; dist: Record<string, number> }> {
  let query = supabase
    .from('stances')
    .select(`
      score,
      profiles!inner(city, state, country_iso)
    `)
    .eq('question_id', questionId);

  // Apply region filtering
  if (regionLevel === 'city' && regionKey) {
    query = query.eq('profiles.city', regionKey);
  } else if (regionLevel === 'state' && regionKey) {
    query = query.eq('profiles.state', regionKey);
  } else if (regionLevel === 'country' && regionKey) {
    query = query.eq('profiles.country_iso', regionKey);
  }
  // global = no additional filter

  const { data: stances, error } = await query;

  if (error) throw error;

  const dist: Record<string, number> = { '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0 };
  
  for (const stance of stances || []) {
    const scoreKey = stance.score.toString();
    if (scoreKey in dist) {
      dist[scoreKey]++;
    }
  }

  return {
    sample_size: (stances || []).length,
    dist
  };
}