import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Initialize Supabase client with service role key
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || 'https://nkolvdetonkcjtylodol.supabase.co',
      supabaseServiceKey
    );

    if (path === '/pre-score' && req.method === 'POST') {
      // Mock toxicity pre-score endpoint
      const { text } = await req.json();
      
      if (!text || typeof text !== 'string') {
        return new Response(JSON.stringify({ error: 'Text is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Simple mock toxicity scoring based on keywords and length
      const toxicKeywords = [
        'hate', 'stupid', 'idiot', 'moron', 'dumb', 'kill', 'die', 'murder',
        'nazi', 'fascist', 'terrorist', 'scam', 'fraud', 'fake news'
      ];
      
      const lowerText = text.toLowerCase();
      let score = 0;
      
      // Check for toxic keywords (each adds 0.3 to score)
      toxicKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score += 0.3;
        }
      });
      
      // Check for excessive caps (adds 0.2)
      const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
      if (capsRatio > 0.5 && text.length > 10) {
        score += 0.2;
      }
      
      // Check for excessive punctuation (adds 0.1)
      const punctuationCount = (text.match(/[!?]{2,}/g) || []).length;
      if (punctuationCount > 2) {
        score += 0.1;
      }
      
      // Normalize score to 0-1 range
      const toxicityScore = Math.min(score, 1.0);

      return new Response(JSON.stringify({ toxicityScore }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === '/triage' && req.method === 'POST') {
      // Moderator triage endpoint
      const { reportId, action, commentId, notes, status } = await req.json();

      // Check authorization header for JWT
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Authorization required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const jwt = authHeader.substring(7);
      
      // Verify the JWT and get user info
      const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
      if (userError || !userData.user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = userData.user.id;

      // For now, we'll accept any authenticated user as a moderator
      // In production, you'd check for a 'moderator' role in JWT claims
      
      try {
        // Start transaction-like operations
        const results = [];

        // Update report status if provided
        if (reportId && status) {
          const { data: reportData, error: reportError } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', reportId)
            .select();

          if (reportError) throw reportError;
          results.push({ type: 'report_update', data: reportData });
        }

        // Handle comment actions
        if (action && commentId) {
          if (action === 'hide_comment') {
            const { data: commentData, error: commentError } = await supabase
              .from('comments')
              .update({ is_hidden: true })
              .eq('id', commentId)
              .select();

            if (commentError) throw commentError;
            results.push({ type: 'comment_hidden', data: commentData });
          } else if (action === 'restore_comment') {
            const { data: commentData, error: commentError } = await supabase
              .from('comments')
              .update({ is_hidden: false })
              .eq('id', commentId)
              .select();

            if (commentError) throw commentError;
            results.push({ type: 'comment_restored', data: commentData });
          }

          // Log the moderation action
          const { data: actionData, error: actionError } = await supabase
            .from('moderation_actions')
            .insert({
              comment_id: commentId,
              moderator_id: userId,
              action,
              notes: notes || null
            })
            .select();

          if (actionError) throw actionError;
          results.push({ type: 'action_logged', data: actionData });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          results,
          message: 'Moderation action completed successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Triage error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to execute moderation action',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Unknown endpoint
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});