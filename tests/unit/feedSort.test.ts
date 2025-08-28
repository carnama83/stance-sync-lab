import { sortQuestionsByRelevance, filterQuestions } from '@/features/feed/sort';
import type { Database } from '@/integrations/supabase/types';

type Question = Database['public']['Tables']['questions']['Row'];

describe('Feed Sorting', () => {
  const mockQuestions: Question[] = [
    {
      id: '1',
      title: 'Question 1',
      summary: 'Summary 1',
      topic: 'politics',
      language: 'en',
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-01T12:00:00Z',
      source_links: null,
      story_id: null,
    },
    {
      id: '2', 
      title: 'Question 2',
      summary: 'Summary 2',
      topic: 'technology',
      language: 'es',
      created_at: '2024-01-02T12:00:00Z',
      updated_at: '2024-01-02T12:00:00Z',
      source_links: null,
      story_id: null,
    },
    {
      id: '3',
      title: 'Question 3',
      summary: 'Summary 3', 
      topic: 'local',
      language: 'en',
      created_at: '2024-01-03T12:00:00Z',
      updated_at: '2024-01-03T12:00:00Z',
      source_links: null,
      story_id: null,
    },
  ];

  describe('sortQuestionsByRelevance', () => {
    it('sorts by recency when no user profile provided', () => {
      const sorted = sortQuestionsByRelevance(mockQuestions, null);
      expect(sorted[0].id).toBe('3'); // Most recent
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('1'); // Oldest
    });

    it('prioritizes matching language/country over recency', () => {
      const userProfile = {
        country_iso: 'US',
        country: 'United States',
        state: 'California',
        city: 'San Francisco'
      };

      const sorted = sortQuestionsByRelevance(mockQuestions, userProfile);
      
      // English questions should come first (matching US)
      const englishQuestions = sorted.filter(q => q.language === 'en');
      expect(englishQuestions.length).toBe(2);
      expect(englishQuestions[0].id).toBe('3'); // Most recent English
      expect(englishQuestions[1].id).toBe('1'); // Older English
    });

    it('boosts regional topics', () => {
      const userProfile = {
        country_iso: 'ES',
        country: 'Spain',
        state: 'Madrid',
        city: 'Madrid'
      };

      const regionalQuestions = [
        {
          ...mockQuestions[0],
          topic: 'politics', // Regional topic
          language: 'es',
          created_at: '2024-01-01T12:00:00Z', // Older
        },
        {
          ...mockQuestions[1],
          topic: 'technology', // Not regional
          language: 'es', 
          created_at: '2024-01-02T12:00:00Z', // Newer
        }
      ];

      const sorted = sortQuestionsByRelevance(regionalQuestions, userProfile);
      
      // Politics (regional topic) should come first despite being older
      expect(sorted[0].topic).toBe('politics');
    });

    it('handles empty questions array', () => {
      const sorted = sortQuestionsByRelevance([], null);
      expect(sorted).toEqual([]);
    });

    it('boosts very recent items (within 24 hours)', () => {
      const now = new Date();
      const recentTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
      const olderTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

      const questionsWithTiming = [
        {
          ...mockQuestions[0],
          created_at: olderTime.toISOString(),
          language: 'en',
        },
        {
          ...mockQuestions[1], 
          created_at: recentTime.toISOString(),
          language: 'en',
        }
      ];

      const userProfile = { country_iso: 'US' };
      const sorted = sortQuestionsByRelevance(questionsWithTiming, userProfile);
      
      // Recent item should come first due to recency boost
      expect(sorted[0].id).toBe(questionsWithTiming[1].id);
    });
  });

  describe('filterQuestions', () => {
    it('filters by search query in title', () => {
      const filtered = filterQuestions(mockQuestions, { query: 'question 1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('filters by search query in summary', () => {
      const filtered = filterQuestions(mockQuestions, { query: 'summary 2' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('filters by topic', () => {
      const filtered = filterQuestions(mockQuestions, { topic: 'politics' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].topic).toBe('politics');
    });

    it('filters by language', () => {
      const filtered = filterQuestions(mockQuestions, { language: 'es' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].language).toBe('es');
    });

    it('applies multiple filters', () => {
      const filtered = filterQuestions(mockQuestions, { 
        topic: 'technology',
        language: 'es' 
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('returns empty array when no matches', () => {
      const filtered = filterQuestions(mockQuestions, { query: 'nonexistent' });
      expect(filtered).toHaveLength(0);
    });

    it('returns all questions when no filters applied', () => {
      const filtered = filterQuestions(mockQuestions, {});
      expect(filtered).toHaveLength(3);
    });
  });
});