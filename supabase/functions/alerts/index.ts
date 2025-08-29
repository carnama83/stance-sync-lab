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

    if (req.method === 'POST' && req.url.endsWith('/scan')) {
      console.log('Starting stance shift alerts scan...')
      
      // Get time windows for comparison
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      
      // Get aggregate data for recent periods (simplified approach using existing aggregates)
      const { data: recentAggs, error: recentError } = await supabase
        .from('agg_question_region_daily')
        .select('question_id, histogram, sample_size')
        .gte('day', weekAgo.toISOString().split('T')[0])
        .order('day', { ascending: false })

      const { data: olderAggs, error: olderError } = await supabase
        .from('agg_question_region_daily')
        .select('question_id, histogram, sample_size')
        .gte('day', twoWeeksAgo.toISOString().split('T')[0])
        .lt('day', weekAgo.toISOString().split('T')[0])
        .order('day', { ascending: false })

      if (recentError || olderError) {
        console.error('Error fetching aggregates:', recentError || olderError)
        throw recentError || olderError
      }

      // Group by question_id and calculate shifts
      const questionShifts = new Map()
      
      // Process recent data
      const recentByQuestion = new Map()
      for (const agg of recentAggs || []) {
        if (!recentByQuestion.has(agg.question_id)) {
          recentByQuestion.set(agg.question_id, [])
        }
        recentByQuestion.get(agg.question_id).push(agg)
      }

      // Process older data
      const olderByQuestion = new Map()
      for (const agg of olderAggs || []) {
        if (!olderByQuestion.has(agg.question_id)) {
          olderByQuestion.set(agg.question_id, [])
        }
        olderByQuestion.get(agg.question_id).push(agg)
      }

      // Calculate shifts (simplified: compare average scores)
      for (const [questionId] of recentByQuestion) {
        const recentData = recentByQuestion.get(questionId) || []
        const olderData = olderByQuestion.get(questionId) || []
        
        if (recentData.length === 0 || olderData.length === 0) continue

        // Simplified shift calculation based on histogram data
        const recentAvg = calculateHistogramAverage(recentData)
        const olderAvg = calculateHistogramAverage(olderData)
        
        if (recentAvg !== null && olderAvg !== null) {
          const shift = Math.abs(recentAvg - olderAvg) / 100 // Convert to percentage
          if (shift > 0.1) { // 10% minimum shift to consider
            questionShifts.set(questionId, { shift, recentAvg, olderAvg })
          }
        }
      }

      console.log(`Found ${questionShifts.size} questions with significant shifts`)

      let alertsGenerated = 0
      let emailMockCount = 0

      // Generate alerts for users with stance activity on shifted questions
      for (const [questionId, shiftData] of questionShifts) {
        // Get question details
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .select('id, title, topic')
          .eq('id', questionId)
          .single()

        if (questionError) {
          console.error(`Error fetching question ${questionId}:`, questionError)
          continue
        }

        // Get users who have stances on this question and alerts enabled
        const { data: usersWithStances, error: usersError } = await supabase
          .rpc('rpc_stances_with_location')
          .eq('question_id', questionId)

        if (usersError) {
          console.error(`Error fetching users for question ${questionId}:`, usersError)
          continue
        }

        // Get unique user IDs
        const userIds = [...new Set(usersWithStances?.map(s => s.user_id) || [])]

        for (const userId of userIds) {
          // Check if user has alerts enabled
          const { data: settings, error: settingsError } = await supabase
            .from('notification_settings')
            .select('alerts_enabled, threshold_shift, channel_inapp, channel_email')
            .eq('user_id', userId)
            .single()

          if (settingsError || !settings?.alerts_enabled) continue

          // Check if shift exceeds user's threshold
          if (shiftData.shift < (settings.threshold_shift || 0.2)) continue

          // Create alert notification
          const alertTitle = `Significant shift detected: ${question.title}`
          const alertBody = `Public opinion on "${question.title}" has shifted by ${Math.round(shiftData.shift * 100)}% this week. Check out the latest discussions.`

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'stance_shift',
              title: alertTitle,
              body: alertBody,
              data: {
                question_id: questionId,
                shift_percentage: Math.round(shiftData.shift * 100),
                url: `/question/${questionId}`,
                generated_at: new Date().toISOString()
              }
            })

          if (notificationError) {
            console.error(`Error creating alert for user ${userId}:`, notificationError)
            continue
          }

          alertsGenerated++

          // Mock email delivery
          if (settings.channel_email) {
            emailMockCount++
            console.log(`Mock alert email would be sent for user ${userId}`)
          }
        }
      }

      // Log job run
      const { error: jobError } = await supabase
        .from('job_runs')
        .insert({
          job_name: 'stance_alerts',
          window_start: weekAgo.toISOString(),
          window_end: now.toISOString(),
          status: 'success',
          stats: {
            questionsScanned: questionShifts.size,
            alertsGenerated,
            emailCount: emailMockCount,
            inAppCount: alertsGenerated
          }
        })

      if (jobError) {
        console.error('Error logging job run:', jobError)
      }

      console.log(`Stance alerts completed: ${alertsGenerated} alerts generated, ${emailMockCount} mock emails`)

      return new Response(JSON.stringify({
        success: true,
        alertsGenerated,
        mockEmails: emailMockCount,
        questionsScanned: questionShifts.size
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Alerts function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper function to calculate average from histogram data
function calculateHistogramAverage(aggregates: any[]): number | null {
  if (!aggregates || aggregates.length === 0) return null
  
  let totalWeightedScore = 0
  let totalSamples = 0
  
  for (const agg of aggregates) {
    if (!agg.histogram || !agg.sample_size) continue
    
    const histogram = agg.histogram
    const samples = agg.sample_size
    
    // Simplified: assume histogram has score buckets
    // In a real implementation, this would parse the actual histogram structure
    let weightedSum = 0
    let count = 0
    
    // Mock calculation - in reality, parse the histogram JSON structure
    for (let score = -100; score <= 100; score += 10) {
      const bucket = histogram[score.toString()] || 0
      weightedSum += score * bucket
      count += bucket
    }
    
    if (count > 0) {
      totalWeightedScore += (weightedSum / count) * samples
      totalSamples += samples
    }
  }
  
  return totalSamples > 0 ? totalWeightedScore / totalSamples : null
}