import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-key',
};

interface MockArticle {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

interface StoryCluster {
  title: string;
  summary: string;
  primary_sources: MockArticle[];
  topic: string;
  language: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check dev key for authorization
    const devKey = req.headers.get('X-DEV-KEY');
    const expectedDevKey = Deno.env.get('DEV_KEY');
    
    if (!devKey || devKey !== expectedDevKey) {
      console.log('Unauthorized access attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mock } = await req.json();
    
    if (!mock) {
      return new Response(JSON.stringify({ error: 'Only mock mode supported' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting mock ingestion process...');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Mock news ingestion
    console.log('Step 1: Generating mock articles...');
    const mockArticles = generateMockArticles();
    console.log(`Generated ${mockArticles.length} mock articles`);

    // Step 2: Clustering
    console.log('Step 2: Clustering articles...');
    const clusters = clusterArticles(mockArticles);
    console.log(`Created ${clusters.length} clusters`);

    // Step 3: Persist clusters
    console.log('Step 3: Persisting clusters to database...');
    const insertedClusters = [];
    
    for (const cluster of clusters) {
      const { data, error } = await supabase
        .from('story_clusters')
        .insert({
          title: cluster.title,
          summary: cluster.summary,
          primary_sources: cluster.primary_sources,
          topic: cluster.topic,
          language: cluster.language,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting cluster:', error);
        continue;
      }

      insertedClusters.push(data);
    }

    console.log(`Persisted ${insertedClusters.length} clusters`);

    // Step 4: Generate questions
    console.log('Step 4: Generating AI questions...');
    const questions = [];
    
    for (const cluster of insertedClusters) {
      const question = generateQuestion(cluster);
      
      const { data, error } = await supabase
        .from('questions')
        .insert({
          story_id: cluster.id,
          title: question.title,
          summary: question.summary,
          source_links: cluster.primary_sources.map((source: any) => ({
            title: source.title,
            url: source.url,
            source: source.source
          })),
          topic: cluster.topic,
          language: cluster.language,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting question:', error);
        continue;
      }

      questions.push(data);
    }

    console.log(`Generated ${questions.length} questions`);
    console.log('Mock ingestion process completed successfully');

    return new Response(JSON.stringify({
      success: true,
      articles_processed: mockArticles.length,
      clusters_created: insertedClusters.length,
      questions_generated: questions.length,
      message: 'Mock ingestion completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingest function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockArticles(): MockArticle[] {
  const mockSources = [
    'TechNews Daily', 'Global Politics Today', 'Health & Science Journal',
    'Business Weekly', 'Sports Central', 'Environment Watch'
  ];

  const mockArticleTemplates = [
    {
      title: "New AI Technology Breakthrough Announced by Tech Giants",
      summary: "Major technology companies unveil groundbreaking artificial intelligence capabilities that could revolutionize various industries.",
      topic: "Technology"
    },
    {
      title: "Climate Change Summit Reaches Historic Agreement",
      summary: "World leaders agree on ambitious carbon reduction targets and renewable energy investments for the next decade.",
      topic: "Environment"
    },
    {
      title: "Global Economic Markets Show Unexpected Growth",
      summary: "International markets demonstrate resilience amid ongoing geopolitical tensions and supply chain challenges.",
      topic: "Business"
    },
    {
      title: "Revolutionary Medical Treatment Shows Promise in Clinical Trials",
      summary: "New therapeutic approach demonstrates significant improvement in patient outcomes for previously untreatable conditions.",
      topic: "Health"
    },
    {
      title: "Major Sports Championship Delivers Thrilling Results",
      summary: "Unexpected victories and record-breaking performances mark this year's championship as one of the most exciting in history.",
      topic: "Sports"
    },
    {
      title: "Breakthrough in Renewable Energy Storage Technology",
      summary: "Scientists develop new battery technology that could solve major challenges in storing renewable energy at scale.",
      topic: "Technology"
    },
    {
      title: "International Trade Negotiations Reach Critical Phase",
      summary: "Key stakeholders work toward resolving complex trade disputes that have affected global commerce for months.",
      topic: "Politics"
    },
    {
      title: "Space Exploration Mission Achieves Major Milestone",
      summary: "Latest space mission provides unprecedented insights into planetary formation and potential for extraterrestrial life.",
      topic: "Technology"
    }
  ];

  const articles: MockArticle[] = [];
  
  // Generate variations of each template
  for (const template of mockArticleTemplates) {
    const numVariations = Math.floor(Math.random() * 3) + 1; // 1-3 variations
    
    for (let i = 0; i < numVariations; i++) {
      const source = mockSources[Math.floor(Math.random() * mockSources.length)];
      const hoursAgo = Math.floor(Math.random() * 24) + 1;
      const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
      
      articles.push({
        title: i === 0 ? template.title : `${template.title} - Update ${i + 1}`,
        summary: template.summary,
        url: `https://example.com/article-${Date.now()}-${i}`,
        publishedAt,
        source
      });
    }
  }

  return articles;
}

function clusterArticles(articles: MockArticle[]): StoryCluster[] {
  const clusters: StoryCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;

    const clusterArticles = [articles[i]];
    used.add(i);

    // Find similar articles using title similarity
    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;

      const similarity = calculateSimilarity(articles[i].title, articles[j].title);
      
      // Cluster if similarity is high (0.80 threshold for mock cosine, 0.5 for keyword)
      if (similarity >= 0.5) {
        clusterArticles.push(articles[j]);
        used.add(j);
      }
    }

    // Create cluster
    const topic = extractTopic(clusterArticles[0].title);
    const cluster: StoryCluster = {
      title: clusterArticles[0].title,
      summary: `A cluster of ${clusterArticles.length} related articles covering developments in ${topic.toLowerCase()}.`,
      primary_sources: clusterArticles,
      topic: topic,
      language: 'en'
    };

    clusters.push(cluster);
  }

  return clusters;
}

function calculateSimilarity(text1: string, text2: string): number {
  // Simple keyword-based similarity for mock clustering
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

function extractTopic(title: string): string {
  const topicKeywords: Record<string, string[]> = {
    'Technology': ['ai', 'tech', 'digital', 'computer', 'software', 'space', 'innovation'],
    'Politics': ['government', 'election', 'policy', 'congress', 'senate', 'political', 'trade'],
    'Business': ['economy', 'market', 'business', 'trade', 'economic', 'financial', 'commerce'],
    'Health': ['health', 'medical', 'treatment', 'clinical', 'therapeutic', 'patient'],
    'Sports': ['sports', 'championship', 'game', 'team', 'player', 'competition'],
    'Environment': ['climate', 'environment', 'renewable', 'energy', 'green', 'sustainability']
  };

  const lowerTitle = title.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return topic;
    }
  }
  
  return 'General';
}

function generateQuestion(cluster: any): { title: string; summary: string } {
  const topic = cluster.topic.toLowerCase();
  const questionTemplates: Record<string, string[]> = {
    'technology': [
      'How might this technological advancement impact society?',
      'What are the potential benefits and risks of this innovation?',
      'Should there be regulations governing this technology?'
    ],
    'politics': [
      'What are the implications of this political development?',
      'How might this affect different communities?',
      'What should be the next steps in this political process?'
    ],
    'business': [
      'What does this mean for consumers and workers?',
      'How might this economic change affect different regions?',
      'What are the long-term implications of this business development?'
    ],
    'health': [
      'How might this medical breakthrough change treatment options?',
      'What are the ethical considerations of this health development?',
      'Should this treatment be widely accessible?'
    ],
    'sports': [
      'What made this sporting event particularly significant?',
      'How do these results compare to historical performance?',
      'What impact might this have on the sport\'s future?'
    ],
    'environment': [
      'How effective might this environmental initiative be?',
      'What are the potential economic impacts of this green policy?',
      'Should similar measures be adopted more widely?'
    ]
  };

  const templates = questionTemplates[topic] || questionTemplates['technology'];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    title: template,
    summary: `This question explores the implications and broader context of recent developments in ${cluster.topic.toLowerCase()}, encouraging thoughtful discussion about potential impacts and considerations.`
  };
}