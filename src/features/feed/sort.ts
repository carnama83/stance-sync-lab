import type { Database } from "@/integrations/supabase/types";

type Question = Database['public']['Tables']['questions']['Row'];

export interface UserProfile {
  country_iso?: string;
  country?: string;
  state?: string;
  city?: string;
}

/**
 * Sort questions by freshness with locality boost
 * Prioritizes items matching user location, then by recency
 */
export const sortQuestionsByRelevance = (
  questions: Question[], 
  userProfile?: UserProfile | null
): Question[] => {
  if (!questions.length) return questions;

  return [...questions].sort((a, b) => {
    const aCreated = new Date(a.created_at || '');
    const bCreated = new Date(b.created_at || '');
    
    // Calculate locality score (0-3, higher is better)
    const aLocalityScore = calculateLocalityScore(a, userProfile);
    const bLocalityScore = calculateLocalityScore(b, userProfile);
    
    // If locality scores are different, prioritize higher locality
    if (aLocalityScore !== bLocalityScore) {
      return bLocalityScore - aLocalityScore;
    }
    
    // If same locality score, sort by recency
    return bCreated.getTime() - aCreated.getTime();
  });
};

/**
 * Calculate locality relevance score
 * Returns 0-3 where 3 is most relevant
 */
function calculateLocalityScore(
  question: Question, 
  userProfile?: UserProfile | null
): number {
  if (!userProfile) return 0;
  
  let score = 0;
  
  // Check for country match
  if (userProfile.country_iso && question.language) {
    // Simple heuristic: match language to country
    const languageCountryMap: Record<string, string[]> = {
      'en': ['US', 'GB', 'CA', 'AU', 'NZ'],
      'es': ['ES', 'MX', 'AR', 'CO', 'PE'],
      'fr': ['FR', 'CA', 'BE', 'CH'],
      'de': ['DE', 'AT', 'CH'],
      'it': ['IT', 'CH'],
      'pt': ['PT', 'BR'],
    };
    
    const questionLang = question.language.toLowerCase();
    const userCountry = userProfile.country_iso.toUpperCase();
    
    if (languageCountryMap[questionLang]?.includes(userCountry)) {
      score += 1;
    }
  }
  
  // Boost for topics that might be regionally relevant
  if (question.topic && userProfile.country) {
    const regionalTopics = ['politics', 'local', 'government', 'policy', 'election'];
    const topicLower = question.topic.toLowerCase();
    
    if (regionalTopics.some(topic => topicLower.includes(topic))) {
      score += 1;
    }
  }
  
  // Additional boost for very recent items (within last 24 hours)
  if (question.created_at) {
    const questionTime = new Date(question.created_at);
    const hoursAgo = (Date.now() - questionTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo <= 24) {
      score += 1;
    }
  }
  
  return Math.min(score, 3); // Cap at 3
}

/**
 * Filter questions by search criteria
 */
export interface SearchFilters {
  query?: string;
  topic?: string;
  language?: string;
}

export const filterQuestions = (
  questions: Question[],
  filters: SearchFilters
): Question[] => {
  return questions.filter(question => {
    // Text search in title and summary
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const title = (question.title || '').toLowerCase();
      const summary = (question.summary || '').toLowerCase();
      
      if (!title.includes(query) && !summary.includes(query)) {
        return false;
      }
    }
    
    // Topic filter
    if (filters.topic && question.topic !== filters.topic) {
      return false;
    }
    
    // Language filter  
    if (filters.language && question.language !== filters.language) {
      return false;
    }
    
    return true;
  });
};