import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface DeleteRequest {
  token?: string;
}

interface ConsentRequest {
  consent_type: string;
  version: string;
  granted: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Optional dev key check
  const devKey = req.headers.get('X-DEV-KEY');
  const expectedDevKey = Deno.env.get('DEV_DEVKEY');
  if (expectedDevKey && devKey !== expectedDevKey) {
    return new Response(
      JSON.stringify({ error: 'Invalid dev key' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Client for user operations
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  // Admin client for user deletion
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (path === '/delete/initiate' && req.method === 'POST') {
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const confirmToken = crypto.randomUUID();
      const deleteAfter = new Date();
      deleteAfter.setDate(deleteAfter.getDate() + 14);

      // Upsert deletion request
      const { error } = await supabase
        .from('deletion_requests')
        .upsert({
          user_id: user.id,
          status: 'pending',
          confirm_token: confirmToken,
          delete_after: deleteAfter.toISOString(),
          requested_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Create in-app notification (mock email)
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'account_deletion',
          title: 'Account Deletion Requested',
          body: `Your account deletion has been scheduled for ${deleteAfter.toDateString()}. Use token: ${confirmToken} to confirm.`,
          data: { confirm_token: confirmToken, delete_after: deleteAfter.toISOString() }
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Deletion request created',
          delete_after: deleteAfter.toISOString(),
          confirm_token: confirmToken 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/delete/confirm' && req.method === 'POST') {
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { token }: DeleteRequest = await req.json();
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify token and update status
      const { error } = await supabase
        .from('deletion_requests')
        .update({ 
          status: 'confirmed', 
          confirmed_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('confirm_token', token)
        .eq('status', 'pending');

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Deletion confirmed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/delete/cancel' && req.method === 'POST') {
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('deletion_requests')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Deletion cancelled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/consent' && req.method === 'POST') {
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { consent_type, version, granted }: ConsentRequest = await req.json();

      const { error } = await supabase
        .from('consent_logs')
        .insert({
          user_id: user.id,
          consent_type,
          version,
          granted,
        });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Consent recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/purge' && req.method === 'POST') {
      // Get confirmed deletion requests past their delete_after date
      const { data: requests, error: fetchError } = await adminSupabase
        .from('deletion_requests')
        .select('*')
        .eq('status', 'confirmed')
        .lt('delete_after', new Date().toISOString());

      if (fetchError) throw fetchError;

      const results = [];
      for (const request of requests || []) {
        try {
          // Delete user via admin API
          const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(request.user_id);
          
          if (deleteError) {
            await adminSupabase
              .from('deletion_requests')
              .update({ 
                error: deleteError.message,
                purged_at: new Date().toISOString()
              })
              .eq('user_id', request.user_id);
            
            results.push({ user_id: request.user_id, success: false, error: deleteError.message });
          } else {
            await adminSupabase
              .from('deletion_requests')
              .update({ 
                status: 'purged',
                purged_at: new Date().toISOString()
              })
              .eq('user_id', request.user_id);

            results.push({ user_id: request.user_id, success: true });
          }
        } catch (err) {
          results.push({ user_id: request.user_id, success: false, error: err.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Account function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});