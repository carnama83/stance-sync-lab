/**
 * Client-side NLP extraction stub for stance analysis
 * Uses simple heuristics to suggest stance scores from text
 */

export interface ExtractionResult {
  score: number;
  confidence: number;
}

// Keywords that suggest strong positive stance
const strongPositiveKeywords = [
  'strongly support', 'completely agree', 'absolutely right', 'excellent idea',
  'brilliant', 'perfect', 'outstanding', 'love this', 'great idea'
];

// Keywords that suggest positive stance  
const positiveKeywords = [
  'support', 'agree', 'good', 'right', 'yes', 'favor', 'positive',
  'helpful', 'beneficial', 'approve', 'like', 'endorse'
];

// Keywords that suggest negative stance
const negativeKeywords = [
  'oppose', 'disagree', 'bad', 'wrong', 'no', 'against', 'negative',
  'harmful', 'disapprove', 'dislike', 'reject', 'problematic'
];

// Keywords that suggest strong negative stance
const strongNegativeKeywords = [
  'strongly oppose', 'completely disagree', 'absolutely wrong', 'terrible idea',
  'awful', 'horrible', 'hate this', 'worst', 'disastrous'
];

/**
 * Extract suggested stance score from text using keyword heuristics
 */
export const extractStance = (text: string): ExtractionResult => {
  if (!text || text.trim().length === 0) {
    return { score: 0, confidence: 0 };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let score = 0;
  let matchedKeywords = 0;
  let totalWeight = 0;

  // Check for strong negative keywords (score: -2)
  strongNegativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += -2;
      matchedKeywords++;
      totalWeight += 2; // Higher weight for strong keywords
    }
  });

  // Check for negative keywords (score: -1)  
  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += -1;
      matchedKeywords++;
      totalWeight += 1;
    }
  });

  // Check for positive keywords (score: +1)
  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 1;
      matchedKeywords++;
      totalWeight += 1;
    }
  });

  // Check for strong positive keywords (score: +2)
  strongPositiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 2;
      matchedKeywords++;
      totalWeight += 2; // Higher weight for strong keywords
    }
  });

  // Calculate average score
  const averageScore = matchedKeywords > 0 ? score / matchedKeywords : 0;
  
  // Clamp to valid range
  const clampedScore = Math.max(-2, Math.min(2, Math.round(averageScore)));

  // Calculate confidence based on keyword matches and text length
  const textLength = words.length;
  const keywordDensity = matchedKeywords / Math.max(textLength, 1);
  
  // Confidence increases with keyword matches but decreases if text is very short or very long
  let confidence = Math.min(keywordDensity * 2, 1.0);
  
  // Reduce confidence for very short texts
  if (textLength < 5) {
    confidence *= 0.5;
  }
  
  // Reduce confidence for very long texts without many matches
  if (textLength > 50 && keywordDensity < 0.1) {
    confidence *= 0.7;
  }

  // Boost confidence if we have strong keyword matches
  if (totalWeight > matchedKeywords) {
    confidence = Math.min(confidence * 1.3, 1.0);
  }

  return {
    score: clampedScore,
    confidence: Math.round(confidence * 100) / 100 // Round to 2 decimal places
  };
};