import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting (simple in-memory store)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if public API is enabled
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'public_api_enabled')
      .single();

    const isEnabled = settings?.value?.enabled === true;

    const url = new URL(req.url);
    const pathname = url.pathname;

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimitData = rateLimits.get(clientIP);

    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= RATE_LIMIT) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded', 
            reset_time: new Date(rateLimitData.resetTime).toISOString() 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        rateLimitData.count++;
      } else {
        rateLimits.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW });
      }
    } else {
      rateLimits.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW });
    }

    if (pathname.endsWith('/v1/aggregates')) {
      const searchParams = url.searchParams;
      const topic = searchParams.get('topic');
      const region = searchParams.get('region');

      if (!isEnabled) {
        return new Response(JSON.stringify({
          notice: "Public API disabled in this environment.",
          mock_data: {
            scope: topic && region ? 'topic_region' : topic ? 'topic' : 'region',
            topic: topic || null,
            region: region || null,
            sample_size: 150,
            distribution: {
              "-2": 12,
              "-1": 28,
              "0": 45,
              "1": 38,
              "2": 27
            },
            trend: {
              "pct_change_7d": 0.05,
              "pct_change_30d": -0.02
            },
            timestamp: new Date().toISOString(),
            version: "v1"
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // When enabled in the future, this would return real data
      return new Response(JSON.stringify({
        error: "API implementation pending",
        message: "Public API is enabled but implementation is not yet complete"
      }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname.endsWith('/v1/openapi.json')) {
      const openApiSpec = {
        openapi: "3.0.0",
        info: {
          title: "Research Data API",
          version: "1.0.0",
          description: "Anonymized aggregate data access"
        },
        servers: [
          {
            url: `${supabaseUrl}/functions/v1/public_api`,
            description: "Production server"
          }
        ],
        paths: {
          "/v1/aggregates": {
            get: {
              summary: "Get aggregated stance data",
              parameters: [
                {
                  name: "topic",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by topic"
                },
                {
                  name: "region",
                  in: "query",
                  schema: { type: "string" },
                  description: "Filter by region (city, state, or country)"
                }
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          scope: { type: "string" },
                          topic: { type: "string", nullable: true },
                          region: { type: "string", nullable: true },
                          sample_size: { type: "integer" },
                          distribution: {
                            type: "object",
                            properties: {
                              "-2": { type: "integer" },
                              "-1": { type: "integer" },
                              "0": { type: "integer" },
                              "1": { type: "integer" },
                              "2": { type: "integer" }
                            }
                          },
                          trend: {
                            type: "object",
                            properties: {
                              pct_change_7d: { type: "number" },
                              pct_change_30d: { type: "number" }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                "429": {
                  description: "Rate limit exceeded"
                }
              }
            }
          }
        }
      };

      return new Response(JSON.stringify(openApiSpec, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Public API function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});