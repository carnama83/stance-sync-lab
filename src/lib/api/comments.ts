import { supabase } from "@/integrations/supabase/client";

export interface Comment {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  toxicity_flag: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  upvote_count?: number;
  user_upvoted?: boolean;
  user_handle?: string;
}

export interface CreateCommentData {
  questionId: string;
  body: string;
  toxicityFlag?: boolean;
}

export interface ReportData {
  commentId: string;
  reason: string;
  severity: 'normal' | 'high';
}

export interface ModTriageData {
  reportId?: string;
  action?: 'hide_comment' | 'restore_comment' | 'restrict_user' | 'ban_user';
  commentId?: string;
  notes?: string;
  status?: 'open' | 'triaged' | 'actioned' | 'dismissed';
}

export const listComments = async (
  questionId: string,
  options: { sort?: 'helpful' | 'latest' } = {}
) => {
  const { sort = 'latest' } = options;

  // Get current user to check upvotes
  const { data: { user } } = await supabase.auth.getUser();
  
  // Base query for comments - simple approach without complex joins
  let query = supabase
    .from('comments')
    .select('*')
    .eq('question_id', questionId)
    .eq('is_hidden', false); // Hide hidden comments for regular users

  // Add sorting
  if (sort === 'latest') {
    query = query.order('created_at', { ascending: false });
  }

  const { data: comments, error } = await query;
  if (error) throw error;

  if (!comments) return [];

  // Get upvote counts and user's upvote status
  const commentIds = comments.map(c => c.id);
  
  const { data: votes } = await supabase
    .from('comment_votes')
    .select('comment_id, user_id')
    .in('comment_id', commentIds);

  // Get user handles for each comment
  const userIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_handle')
    .in('id', userIds);

  // Calculate upvote counts and user upvote status
  const commentsWithVotes = comments.map(comment => {
    const commentVotes = votes?.filter(v => v.comment_id === comment.id) || [];
    const upvote_count = commentVotes.length;
    const user_upvoted = user ? commentVotes.some(v => v.user_id === user.id) : false;
    const userProfile = profiles?.find(p => p.id === comment.user_id);
    
    return {
      ...comment,
      upvote_count,
      user_upvoted,
      user_handle: userProfile?.display_handle || 'Anonymous'
    };
  });

  // Sort by helpful if requested (by upvotes desc, then recent)
  if (sort === 'helpful') {
    commentsWithVotes.sort((a, b) => {
      if (b.upvote_count !== a.upvote_count) {
        return b.upvote_count - a.upvote_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return commentsWithVotes;
};

export const createComment = async (data: CreateCommentData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      question_id: data.questionId,
      user_id: user.id,
      body: data.body,
      toxicity_flag: data.toxicityFlag || false,
    })
    .select()
    .single();

  if (error) throw error;
  return comment;
};

export const toggleUpvote = async (commentId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  // Check if user already upvoted
  const { data: existingVote } = await supabase
    .from('comment_votes')
    .select('*')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingVote) {
    // Remove upvote
    const { error } = await supabase
      .from('comment_votes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return false; // Upvote removed
  } else {
    // Add upvote
    const { error } = await supabase
      .from('comment_votes')
      .insert({
        comment_id: commentId,
        user_id: user.id,
      });
    
    if (error) throw error;
    return true; // Upvote added
  }
};

export const fileReport = async (data: ReportData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      comment_id: data.commentId,
      reporter_id: user.id,
      reason: data.reason,
      severity: data.severity,
    })
    .select()
    .single();

  if (error) throw error;
  return report;
};

export const modTriage = async (data: ModTriageData) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User must be authenticated');

  const response = await supabase.functions.invoke('moderation', {
    body: {
      reportId: data.reportId,
      action: data.action,
      commentId: data.commentId,
      notes: data.notes,
      status: data.status,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (response.error) throw response.error;
  return response.data;
};

// Simple client-side toxicity check for warnings
export const checkToxicity = (text: string): { isToxic: boolean; score: number } => {
  const toxicKeywords = [
    'hate', 'stupid', 'idiot', 'moron', 'dumb', 'kill', 'die', 'murder',
    'nazi', 'fascist', 'terrorist', 'scam', 'fraud', 'fake news'
  ];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Check for toxic keywords
  toxicKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 0.3;
    }
  });
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    score += 0.2;
  }
  
  // Check for excessive punctuation
  const punctuationCount = (text.match(/[!?]{2,}/g) || []).length;
  if (punctuationCount > 2) {
    score += 0.1;
  }
  
  const normalizedScore = Math.min(score, 1.0);
  return {
    isToxic: normalizedScore > 0.6, // Conservative threshold
    score: normalizedScore
  };
};