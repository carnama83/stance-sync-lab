import { clusterArticles, type MockArticle } from '@/lib/utils/clustering';

describe('Article Clustering', () => {
  test('should group similar articles into clusters', () => {
    const mockArticles: MockArticle[] = [
      {
        title: 'AI Technology Breakthrough in Machine Learning',
        summary: 'New AI advancement',
        url: 'https://example.com/ai1',
        publishedAt: '2024-01-01T00:00:00Z',
        source: 'TechNews'
      },
      {
        title: 'Artificial Intelligence Revolution in Tech Industry',
        summary: 'AI changing everything',
        url: 'https://example.com/ai2',
        publishedAt: '2024-01-01T01:00:00Z',
        source: 'TechDaily'
      },
      {
        title: 'Climate Change Summit Reaches Agreement',
        summary: 'Environmental progress',
        url: 'https://example.com/climate1',
        publishedAt: '2024-01-01T02:00:00Z',
        source: 'GreenNews'
      },
      {
        title: 'Sports Championship Final Results',
        summary: 'Team wins championship',
        url: 'https://example.com/sports1',
        publishedAt: '2024-01-01T03:00:00Z',
        source: 'SportsCenter'
      }
    ];

    const clusters = clusterArticles(mockArticles);
    
    expect(clusters).toHaveLength(3); // AI articles should cluster together
    
    // Find the AI cluster
    const aiCluster = clusters.find(c => 
      c.primary_sources.some(s => s.title.toLowerCase().includes('ai'))
    );
    
    expect(aiCluster).toBeDefined();
    expect(aiCluster!.primary_sources).toHaveLength(2); // Both AI articles
    expect(aiCluster!.topic).toBe('Technology');
  });

  test('should create separate clusters if no similarity', () => {
    const mockArticles: MockArticle[] = [
      {
        title: 'Quantum Computing Research Breakthrough',
        summary: 'Quantum advancement',
        url: 'https://example.com/quantum',
        publishedAt: '2024-01-01T00:00:00Z',
        source: 'ScienceNews'
      },
      {
        title: 'Professional Basketball Season Ends',
        summary: 'Basketball season wrap-up',
        url: 'https://example.com/basketball',
        publishedAt: '2024-01-01T01:00:00Z',
        source: 'ESPN'
      },
      {
        title: 'Local Restaurant Opens Downtown',
        summary: 'New dining option',
        url: 'https://example.com/restaurant',
        publishedAt: '2024-01-01T02:00:00Z',
        source: 'LocalNews'
      }
    ];

    const clusters = clusterArticles(mockArticles);
    
    expect(clusters).toHaveLength(3); // Each article should be its own cluster
    clusters.forEach(cluster => {
      expect(cluster.primary_sources).toHaveLength(1);
    });
  });

  test('should assign appropriate topics', () => {
    const mockArticles: MockArticle[] = [
      {
        title: 'Government Election Results Announced',
        summary: 'Political update',
        url: 'https://example.com/election',
        publishedAt: '2024-01-01T00:00:00Z',
        source: 'PoliticsToday'
      },
      {
        title: 'Medical Treatment Clinical Trial Success',
        summary: 'Health breakthrough',
        url: 'https://example.com/medical',
        publishedAt: '2024-01-01T01:00:00Z',
        source: 'HealthNews'
      },
      {
        title: 'Stock Market Economic Analysis',
        summary: 'Business update',
        url: 'https://example.com/stocks',
        publishedAt: '2024-01-01T02:00:00Z',
        source: 'BusinessWeek'
      }
    ];

    const clusters = clusterArticles(mockArticles);
    
    const topics = clusters.map(c => c.topic);
    expect(topics).toContain('Politics');
    expect(topics).toContain('Health');
    expect(topics).toContain('Business');
  });

  test('should handle high similarity threshold clustering', () => {
    const mockArticles: MockArticle[] = [
      {
        title: 'Breaking: Technology Company Announces Major AI Innovation',
        summary: 'Tech news',
        url: 'https://example.com/tech1',
        publishedAt: '2024-01-01T00:00:00Z',
        source: 'Source1'
      },
      {
        title: 'Major Technology Company AI Innovation Announcement Breaking',
        summary: 'Tech update',
        url: 'https://example.com/tech2',
        publishedAt: '2024-01-01T01:00:00Z',
        source: 'Source2'
      },
      {
        title: 'Completely Different News About Weather Patterns',
        summary: 'Weather news',
        url: 'https://example.com/weather',
        publishedAt: '2024-01-01T02:00:00Z',
        source: 'Source3'
      }
    ];

    const clusters = clusterArticles(mockArticles);
    
    // The two very similar tech articles should cluster together
    expect(clusters).toHaveLength(2);
    
    const techCluster = clusters.find(c => c.topic === 'Technology');
    expect(techCluster).toBeDefined();
    expect(techCluster!.primary_sources).toHaveLength(2);
  });

  test('should create meaningful cluster summaries', () => {
    const mockArticles: MockArticle[] = [
      {
        title: 'Renewable Energy Investment Increases Globally',
        summary: 'Green energy growth',
        url: 'https://example.com/energy1',
        publishedAt: '2024-01-01T00:00:00Z',
        source: 'EnergyNews'
      },
      {
        title: 'Solar Power Technology Advancement Report',
        summary: 'Solar innovation',
        url: 'https://example.com/energy2',
        publishedAt: '2024-01-01T01:00:00Z',
        source: 'GreenTech'
      }
    ];

    const clusters = clusterArticles(mockArticles);
    
    expect(clusters).toHaveLength(1);
    const cluster = clusters[0];
    
    expect(cluster.summary).toBeTruthy();
    expect(cluster.summary).toContain('2'); // Should mention the number of articles
    expect(cluster.summary).toContain('environment'); // Should mention the topic
    expect(cluster.language).toBe('en');
  });
});