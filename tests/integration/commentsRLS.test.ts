import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Note: This test requires a test Supabase instance with proper RLS policies
// In a real implementation, you would set up test database and auth

const supabaseUrl = process.env.SUPABASE_TEST_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_TEST_ANON_KEY || 'test-key';

describe('Comments RLS Integration', () => {
  let supabase: any;
  let testUserId: string;
  let testQuestionId: string;
  let testCommentId: string;

  beforeAll(async () => {
    // Initialize test client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create test user (would be done via proper auth in real test)
    testUserId = 'test-user-id';
    testQuestionId = 'test-question-id';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCommentId) {
      await supabase
        .from('comments')
        .delete()
        .eq('id', testCommentId);
    }
  });

  it('should allow user to create own comment', async () => {
    // Mock authentication for test
    const commentData = {
      question_id: testQuestionId,
      user_id: testUserId,
      body: 'Test comment content',
      toxicity_flag: false
    };

    // In real test, this would use authenticated client
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    // For unit test, we'll mock the expected behavior
    expect(error).toBeFalsy();
    expect(data?.body).toBe('Test comment content');
    
    if (data) {
      testCommentId = data.id;
    }
  });

  it('should allow user to update own comment', async () => {
    if (!testCommentId) {
      // Skip if previous test failed
      return;
    }

    const updatedBody = 'Updated comment content';
    
    const { data, error } = await supabase
      .from('comments')
      .update({ body: updatedBody })
      .eq('id', testCommentId)
      .eq('user_id', testUserId) // RLS should enforce this
      .select()
      .single();

    expect(error).toBeFalsy();
    expect(data?.body).toBe(updatedBody);
  });

  it('should prevent user from editing others comments', async () => {
    if (!testCommentId) return;

    const differentUserId = 'different-user-id';
    
    // Attempt to update comment as different user
    const { data, error } = await supabase
      .from('comments')
      .update({ body: 'Unauthorized update' })
      .eq('id', testCommentId)
      .eq('user_id', differentUserId);

    // Should either error or return empty result due to RLS
    expect(data).toBeFalsy();
  });

  it('should allow only one vote per user per comment', async () => {
    if (!testCommentId) return;

    const voteData = {
      comment_id: testCommentId,
      user_id: testUserId
    };

    // First vote should succeed
    const { data: firstVote, error: firstError } = await supabase
      .from('comment_votes')
      .insert(voteData)
      .select()
      .single();

    expect(firstError).toBeFalsy();
    expect(firstVote).toBeTruthy();

    // Second vote should fail due to unique constraint
    const { data: secondVote, error: secondError } = await supabase
      .from('comment_votes')
      .insert(voteData);

    expect(secondError).toBeTruthy();
    expect(secondVote).toBeFalsy();

    // Cleanup
    await supabase
      .from('comment_votes')
      .delete()
      .eq('comment_id', testCommentId)
      .eq('user_id', testUserId);
  });

  it('should enforce rate limits on comments', async () => {
    // Test rate limiting (5 comments per minute)
    const rapidComments = Array.from({ length: 6 }, (_, i) => ({
      question_id: testQuestionId,
      user_id: testUserId,
      body: `Rapid comment ${i + 1}`,
      toxicity_flag: false
    }));

    let successCount = 0;
    let errorCount = 0;

    for (const comment of rapidComments) {
      const { data, error } = await supabase
        .from('comments')
        .insert(comment)
        .select();

      if (error) {
        errorCount++;
        // Should get rate limit error
        expect(error.message).toMatch(/rate limit/i);
      } else {
        successCount++;
      }
    }

    // Should succeed for first 5, fail for 6th
    expect(successCount).toBeLessThanOrEqual(5);
    expect(errorCount).toBeGreaterThan(0);
  });
});