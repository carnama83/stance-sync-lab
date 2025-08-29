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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const devKey = Deno.env.get('DEV_KEY')!
    
    // Check dev auth
    const requestDevKey = req.headers.get('x-dev-key')
    if (requestDevKey !== devKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST' && req.url.endsWith('/run-weekly')) {
      console.log('Starting weekly digest generation...')
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      // Get users with digest enabled
      const { data: users, error: usersError } = await supabase
        .from('notification_settings')
        .select('user_id')
        .eq('weekly_digest', true)
        .eq('channel_inapp', true)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      let processedCount = 0
      let emailMockCount = 0

      for (const user of users || []) {
        // Get user's recent stance activity
        const { data: recentStances, error: stancesError } = await supabase
          .from('stances')
          .select('question_id, questions(title, topic)')
          .eq('user_id', user.user_id)
          .gte('updated_at', weekAgo.toISOString())
          .limit(5)

        if (stancesError) {
          console.error(`Error fetching stances for user ${user.user_id}:`, stancesError)
          continue
        }

        // Get trending questions (fallback for content)
        const { data: trendingQuestions, error: trendingError } = await supabase
          .from('questions')
          .select('id, title, topic')
          .order('created_at', { ascending: false })
          .limit(3)

        if (trendingError) {
          console.error('Error fetching trending questions:', trendingError)
          continue
        }

        // Compose digest content
        const userQuestions = recentStances?.map(s => s.questions) || []
        const allContent = [...userQuestions, ...(trendingQuestions || [])]
        
        if (allContent.length === 0) continue

        const digestTitle = 'Your Weekly Pulse Digest'
        const digestBody = `Here's what's trending this week:\n\n${allContent
          .slice(0, 5)
          .map((q, i) => `${i + 1}. ${q?.title || 'Untitled'} (${q?.topic || 'General'})`)
          .join('\n')}`

        // Insert notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.user_id,
            type: 'weekly_digest',
            title: digestTitle,
            body: digestBody,
            data: {
              questions: allContent.slice(0, 5).map(q => ({ id: q?.id, title: q?.title })),
              generated_at: new Date().toISOString()
            }
          })

        if (notificationError) {
          console.error(`Error creating notification for user ${user.user_id}:`, notificationError)
          continue
        }

        processedCount++

        // Mock email delivery check
        const { data: settings } = await supabase
          .from('notification_settings')
          .select('channel_email')
          .eq('user_id', user.user_id)
          .single()

        if (settings?.channel_email) {
          emailMockCount++
          console.log(`Mock email would be sent for user ${user.user_id}`)
        }
      }

      // Log job run
      const { error: jobError } = await supabase
        .from('job_runs')
        .insert({
          job_name: 'weekly_digest',
          window_start: weekAgo.toISOString(),
          window_end: new Date().toISOString(),
          status: 'success',
          stats: {
            usersProcessed: processedCount,
            emailCount: emailMockCount,
            inAppCount: processedCount
          }
        })

      if (jobError) {
        console.error('Error logging job run:', jobError)
      }

      console.log(`Weekly digest completed: ${processedCount} users processed, ${emailMockCount} mock emails`)

      return new Response(JSON.stringify({
        success: true,
        processed: processedCount,
        mockEmails: emailMockCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Digest function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})