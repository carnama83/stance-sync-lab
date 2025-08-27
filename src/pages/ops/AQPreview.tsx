import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface StoryCluster {
  id: string;
  title: string;
  summary: string;
  primary_sources: any;
  topic: string;
  language: string;
  created_at: string;
}

interface Question {
  id: string;
  story_id: string;
  title: string;
  summary: string;
  source_links: any;
  topic: string;
  language: string;
  created_at: string;
}

export default function AQPreview() {
  const [devKey, setDevKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState<StoryCluster[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filterTopic, setFilterTopic] = useState('');

  const authorize = () => {
    if (devKey.trim()) {
      setIsAuthorized(true);
      loadData();
    }
  };

  const loadData = async () => {
    try {
      // Load story clusters
      const { data: clustersData, error: clustersError } = await supabase
        .from('story_clusters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (clustersError) throw clustersError;
      setClusters(clustersData || []);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Load Error",
        description: "Failed to load data from database.",
        variant: "destructive"
      });
    }
  };

  const runIngestion = async () => {
    if (!isAuthorized) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ingest', {
        body: { mock: true },
        headers: {
          'X-DEV-KEY': devKey
        }
      });

      if (error) throw error;

      toast({
        title: "Ingestion Complete",
        description: `Processed ${data?.clusters_created || 0} clusters and ${data?.questions_generated || 0} questions.`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Ingestion error:', error);
      toast({
        title: "Ingestion Failed",
        description: error instanceof Error ? error.message : "Failed to run ingestion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClusters = filterTopic 
    ? clusters.filter(c => c.topic.toLowerCase().includes(filterTopic.toLowerCase()))
    : clusters;

  const filteredQuestions = filterTopic
    ? questions.filter(q => q.topic.toLowerCase().includes(filterTopic.toLowerCase()))
    : questions;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dev Access Required</CardTitle>
            <CardDescription>
              Enter the development key to access AQ Preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="devKey">Development Key</Label>
              <Input
                id="devKey"
                type="password"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
                placeholder="Enter DEV_KEY"
              />
            </div>
            <Button onClick={authorize} className="w-full">
              Access Preview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>AI Question Preview (Development)</CardTitle>
            <CardDescription>
              Mock news ingestion and AI question generation testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <Label htmlFor="filterTopic">Filter by Topic</Label>
                <Input
                  id="filterTopic"
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  placeholder="Filter clusters and questions by topic..."
                />
              </div>
              <Button 
                onClick={runIngestion} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Running Ingestion...' : 'Run Mock Ingestion'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{clusters.length}</div>
              <p className="text-sm text-muted-foreground">Story Clusters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{questions.length}</div>
              <p className="text-sm text-muted-foreground">Generated Questions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {[...new Set(clusters.map(c => c.topic))].length}
              </div>
              <p className="text-sm text-muted-foreground">Unique Topics</p>
            </CardContent>
          </Card>
        </div>

        {/* Story Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Story Clusters ({filteredClusters.length})</CardTitle>
            <CardDescription>
              Grouped news articles from mock ingestion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredClusters.map(cluster => (
                <div key={cluster.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{cluster.title}</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline">{cluster.topic}</Badge>
                      <Badge variant="secondary">{cluster.language}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{cluster.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {cluster.primary_sources?.length || 0} sources
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(cluster.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {filteredClusters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No story clusters found. Run mock ingestion to generate data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generated Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions ({filteredQuestions.length})</CardTitle>
            <CardDescription>
              AI-generated neutral questions from story clusters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredQuestions.map(question => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{question.title}</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline">{question.topic}</Badge>
                      <Badge variant="secondary">{question.language}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{question.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {question.source_links?.length || 0} source links
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(question.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No questions found. Run mock ingestion to generate data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}