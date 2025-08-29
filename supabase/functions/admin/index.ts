import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const devKey = Deno.env.get('DEV_KEY')!
    
    // Check auth - either JWT with admin role or dev key
    const authHeader = req.headers.get('authorization')
    const requestDevKey = req.headers.get('x-dev-key')
    
    let supabase
    
    if (requestDevKey === devKey) {
      // Dev access with service role
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      supabase = createClient(supabaseUrl, supabaseServiceKey)
    } else if (authHeader) {
      // Admin user access
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers: { authorization: authHeader } }
      })
      
      // Verify admin role from JWT
      const token = authHeader.replace('Bearer ', '')
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const path = url.pathname

    // News Sources endpoints (J1)
    if (path.endsWith('/sources')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('news_sources')
          .select('*')
          .order('name')

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (req.method === 'POST') {
        const body = await req.json()
        const { data, error } = await supabase
          .from('news_sources')
          .insert(body)
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Update specific source
    if (path.match(/\/sources\/[a-f0-9-]+$/)) {
      const sourceId = path.split('/').pop()
      
      if (req.method === 'PUT') {
        const body = await req.json()
        const { data, error } = await supabase
          .from('news_sources')
          .update(body)
          .eq('id', sourceId)
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (req.method === 'DELETE') {
        const { error } = await supabase
          .from('news_sources')
          .delete()
          .eq('id', sourceId)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Health logging endpoint
    if (path.endsWith('/health') && req.method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabase
        .from('ingestion_health')
        .insert(body)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Pipeline status endpoint (J3)
    if (path.endsWith('/pipeline')) {
      if (req.method === 'GET') {
        const { data: healthData, error: healthError } = await supabase
          .from('ingestion_health')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        const { data: jobsData, error: jobsError } = await supabase
          .from('job_runs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (healthError || jobsError) {
          throw healthError || jobsError
        }

        return new Response(JSON.stringify({
          health: healthData,
          jobs: jobsData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Pipeline retry stub (J3)
    if (path.endsWith('/pipeline/retry') && req.method === 'POST') {
      const body = await req.json()
      const { stage = 'unknown', source_id = null } = body

      // Log a retry attempt
      const { data, error } = await supabase
        .from('job_runs')
        .insert({
          job_name: `retry_${stage}`,
          status: 'success',
          stats: {
            retryAttempt: true,
            source_id,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({
        success: true,
        message: `Retry initiated for ${stage}`,
        jobId: data.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Settings endpoints (J2)
    if (path.endsWith('/settings')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')

        if (error) throw error

        // Convert to key-value object
        const settings = {}
        for (const setting of data || []) {
          settings[setting.key] = setting.value
        }

        return new Response(JSON.stringify(settings), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (req.method === 'POST') {
        const body = await req.json()

        // Update settings
        for (const [key, value] of Object.entries(body)) {
          const { error } = await supabase
            .from('admin_settings')
            .upsert({
              key,
              value: value as any,
              updated_at: new Date().toISOString()
            })

          if (error) throw error
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Admin function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})