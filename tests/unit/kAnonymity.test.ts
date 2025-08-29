import { describe, it, expect } from '@jest/globals';

describe('K-Anonymity Enforcement', () => {
  const enforceKAnonymity = (data: any[], k: number = 25) => {
    // Filter out buckets below k threshold
    return data.filter(bucket => bucket.sample_size >= k);
  };

  const coarsenRegion = (region: string, sampleSize: number, k: number = 25) => {
    if (sampleSize >= k) return region;
    
    // Coarsen from City -> State -> Country
    const parts = region.split(', ');
    if (parts.length > 2) {
      // Try state level
      const stateLevel = parts.slice(-2).join(', ');
      return stateLevel;
    } else if (parts.length > 1) {
      // Try country level
      return parts[parts.length - 1];
    }
    
    // Drop if still below threshold
    return null;
  };

  it('should filter out buckets below k threshold', () => {
    const data = [
      { topic: 'Economy', sample_size: 30, distribution: { '1': 20, '2': 10 } },
      { topic: 'Healthcare', sample_size: 15, distribution: { '1': 10, '2': 5 } },
      { topic: 'Education', sample_size: 50, distribution: { '1': 30, '2': 20 } }
    ];

    const filtered = enforceKAnonymity(data, 25);
    
    expect(filtered).toHaveLength(2);
    expect(filtered.map(d => d.topic)).toEqual(['Economy', 'Education']);
  });

  it('should coarsen regions when sample size is below threshold', () => {
    expect(coarsenRegion('Mumbai, Maharashtra, India', 15, 25)).toBe('Maharashtra, India');
    expect(coarsenRegion('California, US', 10, 25)).toBe('US');
    expect(coarsenRegion('Canada', 5, 25)).toBeNull();
  });

  it('should preserve regions when sample size meets threshold', () => {
    expect(coarsenRegion('Mumbai, Maharashtra, India', 50, 25)).toBe('Mumbai, Maharashtra, India');
    expect(coarsenRegion('California, US', 30, 25)).toBe('California, US');
    expect(coarsenRegion('Canada', 25, 25)).toBe('Canada');
  });

  it('should handle empty data gracefully', () => {
    const filtered = enforceKAnonymity([], 25);
    expect(filtered).toHaveLength(0);
  });

  it('should respect custom k values', () => {
    const data = [
      { topic: 'Economy', sample_size: 8, distribution: { '1': 5, '2': 3 } },
      { topic: 'Healthcare', sample_size: 12, distribution: { '1': 8, '2': 4 } }
    ];

    const filtered = enforceKAnonymity(data, 10);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].topic).toBe('Healthcare');
  });
});