import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import { sortQuestionsByRelevance, filterQuestions, type SearchFilters } from "@/features/feed/sort";
import { sanitizeHtml, stripHtml } from "@/lib/utils/sanitizer";  
import SourceLinks from "@/components/questions/SourceLinks";
import type { Database } from "@/integrations/supabase/types";

type Question = Database['public']['Tables']['questions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const QUESTIONS_PER_PAGE = 20;

export default function Feed() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  // Fetch questions and filter options
  useEffect(() => {
    fetchQuestions(true);
    fetchFilterOptions();
  }, []);

  const fetchQuestions = async (reset = false) => {
    const isReset = reset || currentPage === 0;
    setLoading(isReset);
    setLoadingMore(!isReset);

    try {
      const from = isReset ? 0 : (currentPage + 1) * QUESTIONS_PER_PAGE;
      const to = from + QUESTIONS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (isReset) {
        setQuestions(data || []);
        setCurrentPage(0);
      } else {
        setQuestions(prev => [...prev, ...(data || [])]);
        setCurrentPage(prev => prev + 1);
      }

      setHasMore((data || []).length === QUESTIONS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Get unique topics and languages
      const { data } = await supabase
        .from('questions')
        .select('topic, language');

      if (data) {
        const topics = [...new Set(data.map(q => q.topic).filter(Boolean))];
        const languages = [...new Set(data.map(q => q.language).filter(Boolean))];
        setAvailableTopics(topics);
        setAvailableLanguages(languages);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Apply filters and sorting
  const filteredAndSortedQuestions = sortQuestionsByRelevance(
    filterQuestions(questions, filters),
    profile
  );

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, query: query || undefined }));
  };

  const handleTopicChange = (topic: string) => {
    setFilters(prev => ({ ...prev, topic: topic === 'all' ? undefined : topic }));
  };

  const handleLanguageChange = (language: string) => {
    setFilters(prev => ({ ...prev, language: language === 'all' ? undefined : language }));
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Question Feed</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search questions..."
              className="pl-10"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          
          <Select onValueChange={handleTopicChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {availableTopics.map(topic => (
                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {availableLanguages.map(lang => (
                <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="space-y-6">
        {filteredAndSortedQuestions.map((question) => (
          <Card key={question.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link 
                  to={`/question/${question.id}`}
                  className="text-xl font-semibold hover:text-primary transition-colors"
                >
                  {question.title}
                </Link>
                <div className="flex gap-2">
                  {question.topic && (
                    <Badge variant="secondary">{question.topic}</Badge>
                  )}
                  {question.language && (
                    <Badge variant="outline">{question.language.toUpperCase()}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p 
                className="text-muted-foreground mb-4 line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(question.summary || '')
                }}
              />
              
              <SourceLinks value={question.source_links} />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {question.created_at && new Date(question.created_at).toLocaleDateString()}
                </span>
                <Link to={`/question/${question.id}`}>
                  <Button variant="outline" size="sm">
                    Share Your Stance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button 
            onClick={() => fetchQuestions()}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Questions'
            )}
          </Button>
        </div>
      )}

      {!hasMore && filteredAndSortedQuestions.length > 0 && (
        <div className="text-center mt-8 text-muted-foreground">
          You've reached the end of the feed
        </div>
      )}

      {filteredAndSortedQuestions.length === 0 && !loading && (
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">No questions match your search criteria</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setFilters({});
              fetchQuestions(true);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}