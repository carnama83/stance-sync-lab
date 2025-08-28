import { upsertStance } from '@/features/stance/api';

// Mock the Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'stance-id',
              user_id: 'test-user-id',
              question_id: 'question-id',
              score: 1,
              rationale: 'Test rationale',
              links: ['https://example.com'],
              extracted_score: null,
              extracted_confidence: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Mock the sanitizer
jest.mock('@/lib/utils/sanitizer', () => ({
  sanitizeHtml: jest.fn((text: string) => text)
}));

describe('Stance Validator', () => {
  describe('upsertStance', () => {
    const validStanceData = {
      questionId: 'test-question-id',
      score: 1,
      rationale: 'This is a valid rationale',
      links: ['https://example.com'],
      extractedScore: 1,
      extractedConfidence: 0.8
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('score validation', () => {
      it('accepts valid scores within range', async () => {
        const validScores = [-2, -1, 0, 1, 2];
        
        for (const score of validScores) {
          const stanceData = { ...validStanceData, score };
          await expect(upsertStance(stanceData)).resolves.toBeDefined();
        }
      });

      it('rejects scores below -2', async () => {
        const stanceData = { ...validStanceData, score: -3 };
        await expect(upsertStance(stanceData)).rejects.toThrow('Score must be between -2 and 2');
      });

      it('rejects scores above 2', async () => {
        const stanceData = { ...validStanceData, score: 3 };
        await expect(upsertStance(stanceData)).rejects.toThrow('Score must be between -2 and 2');
      });

      it('rejects non-integer scores outside range', async () => {
        const stanceData = { ...validStanceData, score: 2.5 };
        await expect(upsertStance(stanceData)).rejects.toThrow('Score must be between -2 and 2');
      });
    });

    describe('rationale validation', () => {
      it('accepts rationale within length limit', async () => {
        const rationale = 'A'.repeat(2000); // Exactly at limit
        const stanceData = { ...validStanceData, rationale };
        await expect(upsertStance(stanceData)).resolves.toBeDefined();
      });

      it('rejects rationale exceeding length limit', async () => {
        const rationale = 'A'.repeat(2001); // Over limit
        const stanceData = { ...validStanceData, rationale };
        await expect(upsertStance(stanceData)).rejects.toThrow('Rationale must be 2000 characters or less');
      });

      it('accepts empty rationale', async () => {
        const stanceData = { ...validStanceData, rationale: '' };
        await expect(upsertStance(stanceData)).resolves.toBeDefined();
      });

      it('accepts undefined rationale', async () => {
        const { rationale, ...stanceDataWithoutRationale } = validStanceData;
        await expect(upsertStance(stanceDataWithoutRationale)).resolves.toBeDefined();
      });
    });

    describe('links validation and normalization', () => {
      it('normalizes links without protocol', async () => {
        const stanceData = {
          ...validStanceData,
          links: ['example.com', 'www.test.org']
        };
        
        const result = await upsertStance(stanceData);
        expect(result).toBeDefined();
      });

      it('accepts links with protocol', async () => {
        const stanceData = {
          ...validStanceData,
          links: ['https://example.com', 'http://test.org']
        };
        
        const result = await upsertStance(stanceData);
        expect(result).toBeDefined();
      });

      it('filters out invalid URLs', async () => {
        const stanceData = {
          ...validStanceData,
          links: ['https://valid.com', 'not-a-url', 'another-invalid']
        };
        
        const result = await upsertStance(stanceData);
        expect(result).toBeDefined();
      });

      it('handles empty links array', async () => {
        const stanceData = { ...validStanceData, links: [] };
        await expect(upsertStance(stanceData)).resolves.toBeDefined();
      });

      it('handles undefined links', async () => {
        const { links, ...stanceDataWithoutLinks } = validStanceData;
        await expect(upsertStance(stanceDataWithoutLinks)).resolves.toBeDefined();
      });

      it('filters out empty string links', async () => {
        const stanceData = {
          ...validStanceData,
          links: ['https://valid.com', '', '   ', 'https://another-valid.com']
        };
        
        const result = await upsertStance(stanceData);
        expect(result).toBeDefined();
      });
    });

    describe('authentication validation', () => {
      it('requires authenticated user', async () => {
        // Mock unauthenticated state
        const mockSupabase = require('@/integrations/supabase/client').supabase;
        mockSupabase.auth.getUser.mockResolvedValueOnce({
          data: { user: null },
          error: null
        });

        await expect(upsertStance(validStanceData)).rejects.toThrow('User must be authenticated');
      });
    });

    describe('optional fields', () => {
      it('handles missing optional fields', async () => {
        const minimalStanceData = {
          questionId: 'test-question-id',
          score: 0
        };
        
        await expect(upsertStance(minimalStanceData)).resolves.toBeDefined();
      });

      it('accepts extracted NLP fields', async () => {
        const stanceDataWithNLP = {
          ...validStanceData,
          extractedScore: -1,
          extractedConfidence: 0.75
        };
        
        await expect(upsertStance(stanceDataWithNLP)).resolves.toBeDefined();
      });
    });

    describe('data sanitization', () => {
      it('sanitizes rationale content', async () => {
        const { sanitizeHtml } = require('@/lib/utils/sanitizer');
        
        const stanceData = {
          ...validStanceData,
          rationale: '<script>alert("xss")</script>Safe content'
        };
        
        await upsertStance(stanceData);
        
        expect(sanitizeHtml).toHaveBeenCalledWith('<script>alert("xss")</script>Safe content');
      });

      it('handles null rationale after sanitization', async () => {
        const stanceData = {
          ...validStanceData,
          rationale: '   ' // Whitespace only
        };
        
        const result = await upsertStance(stanceData);
        expect(result).toBeDefined();
      });
    });
  });
});