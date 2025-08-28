import { describe, it, expect } from 'jest';
import { 
  calculatePercentageChange, 
  getStanceChanges, 
  transformForTimeSeriesChart,
  type StanceTimePoint 
} from '@/features/analytics/personal';

describe('Personal Analytics', () => {
  describe('calculatePercentageChange', () => {
    it('should calculate positive percentage change correctly', () => {
      expect(calculatePercentageChange(120, 100)).toBe(20);
    });

    it('should calculate negative percentage change correctly', () => {
      expect(calculatePercentageChange(80, 100)).toBe(-20);
    });

    it('should handle zero previous value', () => {
      expect(calculatePercentageChange(50, 0)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('should handle negative previous values', () => {
      expect(calculatePercentageChange(-50, -100)).toBe(-50);
    });
  });

  describe('getStanceChanges', () => {
    const mockStanceHistory: StanceTimePoint[] = [
      // Recent week (last 7 days)
      { date: '2024-01-15', score: 2, question_id: '1' },
      { date: '2024-01-14', score: 1, question_id: '2' },
      { date: '2024-01-13', score: 2, question_id: '3' },
      
      // Previous week (8-14 days ago)
      { date: '2024-01-08', score: 0, question_id: '4' },
      { date: '2024-01-07', score: -1, question_id: '5' },
      
      // Recent month includes above + these
      { date: '2024-01-01', score: 1, question_id: '6' },
      
      // Previous month (31-60 days ago)
      { date: '2023-12-15', score: -2, question_id: '7' },
      { date: '2023-12-10', score: -1, question_id: '8' },
    ];

    it('should calculate weekly and monthly changes', () => {
      // Mock current date to be 2024-01-16 for consistent testing
      const originalDate = Date;
      const mockDate = new Date('2024-01-16T12:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.getTime = originalDate.getTime;

      const changes = getStanceChanges(mockStanceHistory);
      
      expect(changes.weeklyChange).toBeGreaterThan(0); // Recent week avg (5/3) > previous week avg (-1/2)
      expect(changes.monthlyChange).toBeGreaterThan(0); // Recent month should be more positive
      
      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle empty stance history', () => {
      const changes = getStanceChanges([]);
      expect(changes.weeklyChange).toBe(0);
      expect(changes.monthlyChange).toBe(0);
    });
  });

  describe('transformForTimeSeriesChart', () => {
    const mockStanceHistory: StanceTimePoint[] = [
      { date: '2024-01-15', score: 2, question_id: '1' },
      { date: '2024-01-15', score: 1, question_id: '2' }, // Same date, different question
      { date: '2024-01-14', score: -1, question_id: '3' },
      { date: '2024-01-13', score: 0, question_id: '4' },
    ];

    it('should group by date and calculate averages', () => {
      const result = transformForTimeSeriesChart(mockStanceHistory);
      
      expect(result).toHaveLength(3); // 3 unique dates
      
      // Check 2024-01-15 has average of (2+1)/2 = 1.5
      const jan15 = result.find(r => r.date === '2024-01-15');
      expect(jan15?.score).toBe(1.5);
      expect(jan15?.count).toBe(2);
      
      // Check 2024-01-14 has score of -1
      const jan14 = result.find(r => r.date === '2024-01-14');
      expect(jan14?.score).toBe(-1);
      expect(jan14?.count).toBe(1);
    });

    it('should sort results by date', () => {
      const result = transformForTimeSeriesChart(mockStanceHistory);
      const dates = result.map(r => r.date);
      const sortedDates = [...dates].sort();
      expect(dates).toEqual(sortedDates);
    });

    it('should handle empty input', () => {
      const result = transformForTimeSeriesChart([]);
      expect(result).toEqual([]);
    });
  });
});