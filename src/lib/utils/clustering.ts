/**
 * Mock clustering utilities for Epic B
 */

export interface MockArticle {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface StoryCluster {
  title: string;
  summary: string;
  primary_sources: MockArticle[];
  topic: string;
  language: string;
}

/**
 * Mock cosine similarity calculation (normally would use real embeddings)
 */
function mockCosineSimilarity(text1: string, text2: string): number {
  // Simple word overlap simulation for development
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  // Mock cosine similarity based on Jaccard coefficient
  return intersection.size / union.size;
}

/**
 * Jaccard similarity for keyword overlap fallback
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Group articles into clusters based on similarity thresholds
 */
export function clusterArticles(articles: MockArticle[]): StoryCluster[] {
  const clusters: StoryCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;

    const clusterArticles = [articles[i]];
    used.add(i);

    // Find similar articles
    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;

      const similarity = mockCosineSimilarity(articles[i].title, articles[j].title);
      const keywordSimilarity = jaccardSimilarity(articles[i].title, articles[j].title);

      // Cluster if cosine similarity ≈ 0.80 or keyword overlap ≈ 0.5
      if (similarity >= 0.80 || keywordSimilarity >= 0.5) {
        clusterArticles.push(articles[j]);
        used.add(j);
      }
    }

    // Create cluster summary
    const topics = [...new Set(clusterArticles.map(a => extractTopic(a.title)))];
    const cluster: StoryCluster = {
      title: clusterArticles[0].title,
      summary: `Cluster of ${clusterArticles.length} related articles about ${topics.join(', ')}`,
      primary_sources: clusterArticles,
      topic: topics[0] || 'General',
      language: 'en'
    };

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Extract topic from article title (mock implementation)
 */
function extractTopic(title: string): string {
  const topics: Record<string, string[]> = {
    'Technology': ['tech', 'ai', 'robot', 'computer', 'software', 'app', 'digital'],
    'Politics': ['election', 'vote', 'government', 'president', 'congress', 'senate', 'political'],
    'Business': ['economy', 'market', 'stock', 'trade', 'business', 'company', 'corporate'],
    'Health': ['health', 'medical', 'doctor', 'hospital', 'disease', 'vaccine', 'medicine'],
    'Sports': ['sport', 'game', 'team', 'player', 'championship', 'olympic', 'football', 'basketball'],
    'Environment': ['climate', 'environment', 'green', 'renewable', 'pollution', 'sustainability']
  };

  const lowerTitle = title.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return topic;
    }
  }
  
  return 'General';
}