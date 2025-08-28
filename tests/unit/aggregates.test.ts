import { describe, it, expect } from 'jest';
import { 
  histogramToDistribution,
  calculateAverageScore,
  getConfidenceLevel,
  transformToTrendData,
  calculateTrendChange,
  type Histogram,
  type AggregateData,
  type TrendData
} from '@/features/analytics/aggregates';

describe('Analytics Aggregates', () => {
  const mockHistogram: Histogram = {
    "-2": 10,
    "-1": 15, 
    "0": 20,
    "1": 25,
    "2": 30
  };

  describe('histogramToDistribution', () => {
    it('should convert histogram to distribution chart data', () => {
      const result = histogramToDistribution(mockHistogram);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ score: -2, label: 'Strongly Disagree', count: 10 });
      expect(result[4]).toEqual({ score: 2, label: 'Strongly Agree', count: 30 });
    });
  });

  describe('calculateAverageScore', () => {
    it('should calculate weighted average correctly', () => {
      // (-2*10) + (-1*15) + (0*20) + (1*25) + (2*30) = -20 - 15 + 0 + 25 + 60 = 50
      // Total responses: 10 + 15 + 20 + 25 + 30 = 100
      // Average: 50/100 = 0.5
      const result = calculateAverageScore(mockHistogram);
      expect(result).toBe(0.5);
    });

    it('should handle empty histogram', () => {
      const emptyHistogram: Histogram = { "-2": 0, "-1": 0, "0": 0, "1": 0, "2": 0 };
      const result = calculateAverageScore(emptyHistogram);
      expect(result).toBe(0);
    });

    it('should handle all negative responses', () => {
      const negativeHistogram: Histogram = { "-2": 50, "-1": 50, "0": 0, "1": 0, "2": 0 };
      // (-2*50) + (-1*50) = -150, total = 100, avg = -1.5
      const result = calculateAverageScore(negativeHistogram);
      expect(result).toBe(-1.5);
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return high confidence for large samples', () => {
      expect(getConfidenceLevel(150)).toBe('high');
    });

    it('should return medium confidence for moderate samples', () => {
      expect(getConfidenceLevel(50)).toBe('medium');
    });

    it('should return low confidence for small samples', () => {
      expect(getConfidenceLevel(15)).toBe('low');
    });

    it('should handle boundary cases', () => {
      expect(getConfidenceLevel(100)).toBe('high');
      expect(getConfidenceLevel(30)).toBe('medium');
      expect(getConfidenceLevel(29)).toBe('low');
    });
  });

  describe('transformToTrendData', () => {
    const mockAggregates: AggregateData[] = [
      {
        id: '1',
        day: '2024-01-15',
        question_id: 'q1',
        scope: 'global',
        histogram: { "-2": 0, "-1": 10, "0": 20, "1": 30, "2": 40 },
        sample_size: 100,
        created_at: '2024-01-15T12:00:00Z'
      },
      {
        id: '2',
        day: '2024-01-14',
        question_id: 'q1',
        scope: 'global',
        histogram: { "-2": 20, "-1": 20, "0": 20, "1": 20, "2": 20 },
        sample_size: 50,
        created_at: '2024-01-14T12:00:00Z'
      }
    ];

    it('should transform aggregates to trend data', () => {
      const result = transformToTrendData(mockAggregates);
      
      expect(result).toHaveLength(2);
      
      const jan15 = result.find(r => r.date === '2024-01-15');
      expect(jan15?.sampleSize).toBe(100);
      expect(jan15?.confidence).toBe('high');
      expect(jan15?.avgScore).toBeGreaterThan(0); // Positive average from mock data
      
      const jan14 = result.find(r => r.date === '2024-01-14');
      expect(jan14?.confidence).toBe('medium');
      expect(jan14?.avgScore).toBe(0); // Neutral average
    });

    it('should sort by date', () => {
      const result = transformToTrendData(mockAggregates);
      const dates = result.map(r => r.date);
      expect(dates).toEqual(['2024-01-14', '2024-01-15']); // Should be sorted
    });
  });

  describe('calculateTrendChange', () => {
    const mockTrendData: TrendData[] = [
      { date: '2024-01-01', avgScore: -0.5, sampleSize: 100, confidence: 'high' },
      { date: '2024-01-08', avgScore: 0, sampleSize: 80, confidence: 'high' },
      { date: '2024-01-15', avgScore: 0.5, sampleSize: 120, confidence: 'high' },
      { date: '2024-01-22', avgScore: 1.0, sampleSize: 90, confidence: 'high' },
    ];

    it('should calculate positive trend change', () => {
      // Mock current date to be 2024-01-23 for consistent testing
      const originalDate = Date;
      const mockDate = new Date('2024-01-23T12:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.getTime = originalDate.getTime;

      const change = calculateTrendChange(mockTrendData, 7);
      expect(change).toBeGreaterThan(0); // Recent should be more positive

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle insufficient data', () => {
      const limitedData = mockTrendData.slice(0, 1);
      const change = calculateTrendChange(limitedData, 7);
      expect(change).toBe(0);
    });

    it('should handle edge case with zero previous average', () => {
      const edgeCaseData: TrendData[] = [
        { date: '2024-01-01', avgScore: 0, sampleSize: 50, confidence: 'medium' },
        { date: '2024-01-15', avgScore: 1.0, sampleSize: 60, confidence: 'medium' },
      ];

      const originalDate = Date;
      const mockDate = new Date('2024-01-16T12:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.getTime = originalDate.getTime;

      const change = calculateTrendChange(edgeCaseData, 7);
      expect(change).toBe(100); // Should handle zero denominator case

      global.Date = originalDate;
    });
  });
});