// Daily aggregation Edge Function - DEV KEY gated
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPECTED_DEV_KEY = Deno.env.get('DEV_DEVKEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Histogram = { "-2": number; "-1": number; "0": number; "1": number; "2": number };

function emptyHist(): Histogram {
  return { "-2": 0, "-1": 0, "0": 0, "1": 0, "2": 0 };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Gate with DEV key
  const supplied = req.headers.get('X-DEV-KEY') ?? '';
  if (!EXPECTED_DEV_KEY || supplied !== EXPECTED_DEV_KEY) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    console.log(`Starting aggregation for ${today}`);

    // 1) Get recent questions (limit for dev)
    const { data: qRows, error: qErr } = await supabase
      .from('questions')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (qErr) {
      console.error('Questions fetch error:', qErr);
      return new Response(qErr.message, { status: 500, headers: corsHeaders });
    }

    console.log(`Found ${qRows?.length || 0} questions`);

    // 2) Pull stances joined with locations from profiles via RPC
    const { data: sRows, error: sErr } = await supabase.rpc('rpc_stances_with_location');
    if (sErr) {
      console.error('Stances RPC error:', sErr);
      return new Response(sErr.message, { status: 500, headers: corsHeaders });
    }

    console.log(`Found ${sRows?.length || 0} stance-location records`);

    // 3) Build histograms for each scope
    const upserts: any[] = [];
    const byQuestion = new Map<string, any[]>();
    for (const r of sRows ?? []) {
      if (!byQuestion.has(r.question_id)) byQuestion.set(r.question_id, []);
      byQuestion.get(r.question_id)!.push(r);
    }

    for (const q of (qRows ?? [])) {
      const rows = byQuestion.get(q.id) ?? [];
      
      // Global scope
      let hist = emptyHist();
      let n = 0;
      for (const r of rows) {
        const scoreStr = String(r.score);
        if (scoreStr in hist) {
          hist[scoreStr as keyof Histogram]++;
          n++;
        }
      }
      upserts.push({
        day: today,
        question_id: q.id,
        scope: 'global',
        city: null,
        state: null,
        country_iso: null,
        histogram: hist,
        sample_size: n
      });

      // By country
      const byCountry = new Map<string, any[]>();
      for (const r of rows) {
        if (!r.country_iso) continue;
        const k = r.country_iso;
        if (!byCountry.has(k)) byCountry.set(k, []);
        byCountry.get(k)!.push(r);
      }
      for (const [country, list] of byCountry) {
        hist = emptyHist();
        n = 0;
        for (const r of list) {
          const scoreStr = String(r.score);
          if (scoreStr in hist) {
            hist[scoreStr as keyof Histogram]++;
            n++;
          }
        }
        upserts.push({
          day: today,
          question_id: q.id,
          scope: 'country',
          city: null,
          state: null,
          country_iso: country,
          histogram: hist,
          sample_size: n
        });
      }

      // By state
      const byState = new Map<string, any[]>();
      for (const r of rows) {
        if (!r.state || !r.country_iso) continue;
        const k = `${r.country_iso}|${r.state}`;
        if (!byState.has(k)) byState.set(k, []);
        byState.get(k)!.push(r);
      }
      for (const [key, list] of byState) {
        const [country_iso, state] = key.split('|');
        hist = emptyHist();
        n = 0;
        for (const r of list) {
          const scoreStr = String(r.score);
          if (scoreStr in hist) {
            hist[scoreStr as keyof Histogram]++;
            n++;
          }
        }
        upserts.push({
          day: today,
          question_id: q.id,
          scope: 'state',
          city: null,
          state,
          country_iso,
          histogram: hist,
          sample_size: n
        });
      }

      // By city
      const byCity = new Map<string, any[]>();
      for (const r of rows) {
        if (!r.city || !r.country_iso) continue;
        const k = `${r.country_iso}|${r.state ?? ''}|${r.city}`;
        if (!byCity.has(k)) byCity.set(k, []);
        byCity.get(k)!.push(r);
      }
      for (const [key, list] of byCity) {
        const [country_iso, state, city] = key.split('|');
        hist = emptyHist();
        n = 0;
        for (const r of list) {
          const scoreStr = String(r.score);
          if (scoreStr in hist) {
            hist[scoreStr as keyof Histogram]++;
            n++;
          }
        }
        upserts.push({
          day: today,
          question_id: q.id,
          scope: 'city',
          city,
          state: state || null,
          country_iso,
          histogram: hist,
          sample_size: n
        });
      }
    }

    console.log(`Preparing ${upserts.length} upserts`);

    // 4) Upsert aggregates
    let successCount = 0;
    for (const row of upserts) {
      const { error } = await supabase
        .from('agg_question_region_daily')
        .upsert(row, { 
          onConflict: 'day,question_id,scope,city,state,country_iso',
          ignoreDuplicates: false 
        });
      if (error) {
        console.error('Upsert error:', error, 'for row:', row);
        return new Response(error.message, { status: 500, headers: corsHeaders });
      }
      successCount++;
    }

    console.log(`Successfully upserted ${successCount} aggregate records`);

    return new Response(JSON.stringify({ 
      success: true,
      upserts: successCount,
      day: today 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Aggregate function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});