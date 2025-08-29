import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-key',
}

interface ExportRequest {
  scope: 'topic' | 'region' | 'topic_region'
  topic?: string
  region?: string
  k?: number
  format: 'csv' | 'json'
  date_range?: { from: string; to: string }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify dev key if provided
    const devKey = req.headers.get('x-dev-key');
    const expectedDevKey = Deno.env.get('DEV_DEVKEY');
    if (devKey && devKey !== expectedDevKey) {
      return new Response(JSON.stringify({ error: 'Invalid dev key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === 'POST' && pathname.endsWith('/generate')) {
      const body: ExportRequest = await req.json();
      const { scope, topic, region, k = 25, format, date_range } = body;

      // Get authenticated user
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create export job
      const { data: job, error: jobError } = await supabase
        .from('export_jobs')
        .insert({
          requested_by: user.id,
          format,
          filters: { scope, topic, region, date_range },
          k_threshold: k,
          status: 'queued'
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating export job:', jobError);
        return new Response(JSON.stringify({ error: 'Failed to create export job' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Process export in background (simplified for this implementation)
      setTimeout(async () => {
        try {
          await processExport(supabase, job.id, body);
        } catch (error) {
          console.error('Error processing export:', error);
          await supabase
            .from('export_jobs')
            .update({ 
              status: 'failed', 
              error: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);
        }
      }, 1000); // Process after 1 second

      return new Response(JSON.stringify(job), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET' && pathname.includes('/jobs/')) {
      const jobId = pathname.split('/jobs/')[1];
      
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: job, error: jobError } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) {
        return new Response(JSON.stringify({ error: 'Job not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user owns this job or is admin
      const { data: userProfile } = await supabase.auth.getUser(token);
      const isAdmin = userProfile?.user?.app_metadata?.role === 'admin';
      
      if (job.requested_by !== user.id && !isAdmin) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // If job is complete and has a file, generate signed URL
      let signedUrl = null;
      if (job.status === 'complete' && job.file_path) {
        const { data: urlData } = await supabase.storage
          .from('exports')
          .createSignedUrl(job.file_path, 300); // 5 minute expiry
        signedUrl = urlData?.signedUrl;
      }

      return new Response(JSON.stringify({ ...job, download_url: signedUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Export function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processExport(supabase: any, jobId: string, params: ExportRequest) {
  const { scope, topic, region, k = 25, format } = params;

  // Update job status to running
  await supabase
    .from('export_jobs')
    .update({ status: 'running' })
    .eq('id', jobId);

  // Compute aggregates based on scope
  let aggregates = [];
  
  if (scope === 'topic' && topic) {
    // Get aggregated data for topic
    const { data: stances } = await supabase
      .from('stances')
      .select(`
        score,
        questions!inner(topic)
      `)
      .eq('questions.topic', topic);

    if (stances && stances.length >= k) {
      const distribution = computeDistribution(stances.map(s => s.score));
      aggregates.push({
        scope: 'topic',
        topic,
        region: null,
        sample_size: stances.length,
        distribution
      });
    }
  } else if (scope === 'region' && region) {
    // Get aggregated data for region
    const { data: stances } = await supabase.rpc('rpc_stances_with_location');
    
    const filteredStances = stances?.filter(s => 
      s.city === region || s.state === region || s.country_iso === region
    ) || [];

    if (filteredStances.length >= k) {
      const distribution = computeDistribution(filteredStances.map(s => s.score));
      aggregates.push({
        scope: 'region',
        topic: null,
        region,
        sample_size: filteredStances.length,
        distribution
      });
    }
  }

  // Generate export data based on format
  let content: string;
  let filename: string;
  let contentType: string;

  if (format === 'csv') {
    content = generateCSV(aggregates);
    filename = `export-${jobId}.csv`;
    contentType = 'text/csv';
  } else {
    content = JSON.stringify(aggregates, null, 2);
    filename = `export-${jobId}.json`;
    contentType = 'application/json';
  }

  // Upload to storage
  const filePath = `${jobId}/${filename}`;
  const { error: uploadError } = await supabase.storage
    .from('exports')
    .upload(filePath, content, {
      contentType,
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload export: ${uploadError.message}`);
  }

  // Update job status to complete
  await supabase
    .from('export_jobs')
    .update({
      status: 'complete',
      file_path: filePath,
      row_count: aggregates.length,
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId);

  // Create snapshot record
  for (const agg of aggregates) {
    await supabase
      .from('aggregate_snapshots')
      .insert({
        scope: agg.scope,
        topic: agg.topic,
        region: agg.region,
        k_threshold: k,
        sample_size: agg.sample_size,
        dist: agg.distribution,
        version: 'v1'
      });
  }
}

function computeDistribution(scores: number[]) {
  const dist = { '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0 };
  for (const score of scores) {
    const key = score.toString() as keyof typeof dist;
    if (key in dist) {
      dist[key]++;
    }
  }
  return dist;
}

function generateCSV(aggregates: any[]) {
  const headers = ['scope', 'topic', 'region', 'sample_size', 'strongly_disagree', 'disagree', 'neutral', 'agree', 'strongly_agree'];
  const rows = [headers.join(',')];
  
  for (const agg of aggregates) {
    const row = [
      agg.scope,
      agg.topic || '',
      agg.region || '',
      agg.sample_size,
      agg.distribution['-2'],
      agg.distribution['-1'],
      agg.distribution['0'],
      agg.distribution['1'],
      agg.distribution['2']
    ];
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}