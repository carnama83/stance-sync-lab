import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/utils/sanitizer";

export interface StanceData {
  questionId: string;
  score: number;
  rationale?: string;
  links?: string[];
  extractedScore?: number;
  extractedConfidence?: number;
}

import type { Database } from "@/integrations/supabase/types";

type DbStance = Database['public']['Tables']['stances']['Row'];

export interface Stance {
  id: string;
  user_id: string;
  question_id: string;
  score: number;
  rationale?: string | null;
  links?: string[] | null;
  extracted_score?: number | null;
  extracted_confidence?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's stance for a specific question
 */
export const getUserStance = async (questionId: string): Promise<Stance | null> => {
  const { data, error } = await supabase
    .from('stances')
    .select('*')
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching stance:', error);
    throw error;
  }

  if (!data) return null;

  // Transform database response to our interface
  return {
    ...data,
    links: data.links ? (data.links as string[]) : null,
  };
};

/**
 * Upsert (insert or update) user's stance on a question
 */
export const upsertStance = async (stanceData: StanceData): Promise<Stance> => {
  const { questionId, score, rationale, links, extractedScore, extractedConfidence } = stanceData;

  // Validate score range
  if (score < -2 || score > 2) {
    throw new Error('Score must be between -2 and 2');
  }

  // Validate rationale length
  if (rationale && rationale.length > 2000) {
    throw new Error('Rationale must be 2000 characters or less');
  }

  // Sanitize rationale
  const sanitizedRationale = rationale ? sanitizeHtml(rationale) : null;

  // Normalize links
  const normalizedLinks = links ? normalizeLinks(links) : null;

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('stances')
    .upsert({
      user_id: user.user.id,
      question_id: questionId,
      score,
      rationale: sanitizedRationale,
      links: normalizedLinks,
      extracted_score: extractedScore,
      extracted_confidence: extractedConfidence,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting stance:', error);
    throw error;
  }

  // Transform database response to our interface
  return {
    ...data,
    links: data.links ? (data.links as string[]) : null,
  };
};

/**
 * Normalize and validate links
 */
function normalizeLinks(links: string[]): string[] {
  return links
    .map(link => link.trim())
    .filter(link => link.length > 0)
    .map(link => {
      // Add https:// if no protocol specified
      if (!/^https?:\/\//i.test(link)) {
        return `https://${link}`;
      }
      return link;
    })
    .filter(link => {
      try {
        new URL(link);
        return true;
      } catch {
        return false;
      }
    });
}