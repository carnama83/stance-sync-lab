import { extractStance } from '@/features/stance/nlp/extract';

describe('NLP Stance Extraction', () => {
  describe('extractStance', () => {
    it('returns neutral for empty text', () => {
      const result = extractStance('');
      expect(result.score).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('detects strong positive stance', () => {
      const text = 'I strongly support this excellent idea. It is absolutely right.';
      const result = extractStance(text);
      expect(result.score).toBe(2);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('detects positive stance', () => {
      const text = 'I agree with this proposal. It seems good and beneficial.';
      const result = extractStance(text);
      expect(result.score).toBe(1);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('detects negative stance', () => {
      const text = 'I disagree with this bad idea. It is wrong and harmful.';
      const result = extractStance(text);
      expect(result.score).toBe(-1);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('detects strong negative stance', () => {
      const text = 'I strongly oppose this terrible idea. It is absolutely wrong.';
      const result = extractStance(text);
      expect(result.score).toBe(-2);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('handles mixed sentiment with average', () => {
      const text = 'I support some aspects but disagree with others. Good and bad points.';
      const result = extractStance(text);
      expect(result.score).toBe(0); // Should average out
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('clamps score to valid range', () => {
      // Test with extreme positive keywords
      const text = 'excellent brilliant outstanding perfect love support agree';
      const result = extractStance(text);
      expect(result.score).toBeLessThanOrEqual(2);
      expect(result.score).toBeGreaterThanOrEqual(-2);
    });

    it('reduces confidence for very short text', () => {
      const shortText = 'good';
      const longerText = 'I think this is a really good idea with solid reasoning';
      
      const shortResult = extractStance(shortText);
      const longerResult = extractStance(longerText);
      
      expect(shortResult.confidence).toBeLessThan(longerResult.confidence);
    });

    it('reduces confidence for very long text without many matches', () => {
      const longText = 'This is a very long text that goes on and on about many topics without really expressing a clear stance on the specific issue at hand. It discusses various aspects and considerations but does not use many sentiment keywords to indicate a clear position on the matter being discussed.';
      const result = extractStance(longText);
      
      // Should have low confidence due to low keyword density
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('boosts confidence for strong keywords', () => {
      const strongText = 'I strongly support this';
      const weakText = 'I support this';
      
      const strongResult = extractStance(strongText);
      const weakResult = extractStance(weakText);
      
      expect(strongResult.confidence).toBeGreaterThan(weakResult.confidence);
    });

    it('is case insensitive', () => {
      const upperText = 'I STRONGLY SUPPORT THIS';
      const lowerText = 'i strongly support this';
      
      const upperResult = extractStance(upperText);
      const lowerResult = extractStance(lowerText);
      
      expect(upperResult.score).toBe(lowerResult.score);
    });

    it('handles punctuation and spacing', () => {
      const text = 'I strongly support, this excellent idea!!! It is absolutely right.';
      const result = extractStance(text);
      expect(result.score).toBe(2);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    describe('keyword detection', () => {
      it('detects "strongly support" as +2', () => {
        const result = extractStance('I strongly support this');
        expect(result.score).toBe(2);
      });

      it('detects "completely agree" as +2', () => {
        const result = extractStance('I completely agree with this');
        expect(result.score).toBe(2);
      });

      it('detects "strongly oppose" as -2', () => {
        const result = extractStance('I strongly oppose this');
        expect(result.score).toBe(-2);
      });

      it('detects "completely disagree" as -2', () => {
        const result = extractStance('I completely disagree with this');
        expect(result.score).toBe(-2);
      });

      it('detects simple "support" as +1', () => {
        const result = extractStance('I support this approach');
        expect(result.score).toBe(1);
      });

      it('detects simple "oppose" as -1', () => {
        const result = extractStance('I oppose this measure');
        expect(result.score).toBe(-1);
      });
    });

    describe('confidence scoring', () => {
      it('returns confidence between 0 and 1', () => {
        const result = extractStance('I strongly support this excellent idea');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });

      it('rounds confidence to 2 decimal places', () => {
        const result = extractStance('I support this');
        const decimalPlaces = (result.confidence.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });
  });
});