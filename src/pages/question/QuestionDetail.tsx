import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, ArrowLeft, Info } from "lucide-react";
import { getUserStance, upsertStance, type StanceData } from "@/features/stance/api";
import { extractStance } from "@/features/stance/nlp/extract";
import { sanitizeHtml } from "@/lib/utils/sanitizer";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import type { Stance } from "@/features/stance/api";

type Question = Database['public']['Tables']['questions']['Row'];

const STANCE_LABELS = {
  '-2': 'Strongly Against',
  '-1': 'Against', 
  '0': 'Neutral',
  '1': 'For',
  '2': 'Strongly For'
};

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [stance, setStance] = useState<Stance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form state
  const [score, setScore] = useState([0]);
  const [rationale, setRationale] = useState('');
  const [linksText, setLinksText] = useState('');
  const [extractedResult, setExtractedResult] = useState<{score: number; confidence: number} | null>(null);
  const [showExtractionPrompt, setShowExtractionPrompt] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate('/auth/signup');
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch question and existing stance
  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch question
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (questionError) throw questionError;
        if (!questionData) {
          toast({
            title: "Question not found",
            description: "The question you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/feed');
          return;
        }

        setQuestion(questionData);

        // Fetch existing stance
        try {
          const existingStance = await getUserStance(id);
          if (existingStance) {
            setStance(existingStance);
            setScore([existingStance.score]);
            setRationale(existingStance.rationale || '');
            const links = existingStance.links || [];
            setLinksText(links.join('\n'));
          }
        } catch (error) {
          console.error('Error fetching stance:', error);
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        toast({
          title: "Error",
          description: "Failed to load question details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate, toast]);

  // Auto-extract stance when rationale changes
  useEffect(() => {
    if (rationale.trim()) {
      const result = extractStance(rationale);
      setExtractedResult(result);
      
      // Show prompt if confidence is low
      if (result.confidence < 0.6 && result.confidence > 0) {
        setShowExtractionPrompt(true);
      } else {
        setShowExtractionPrompt(false);
      }
    } else {
      setExtractedResult(null);
      setShowExtractionPrompt(false);
    }
  }, [rationale]);

  const handleSave = async () => {
    if (!question || !user) return;

    setSaving(true);
    try {
      const links = linksText
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0);

      const stanceData: StanceData = {
        questionId: question.id,
        score: score[0],
        rationale: rationale.trim() || undefined,
        links: links.length > 0 ? links : undefined,
        extractedScore: extractedResult?.score,
        extractedConfidence: extractedResult?.confidence,
      };

      const savedStance = await upsertStance(stanceData);
      setStance(savedStance);

      toast({
        title: "Stance saved",
        description: "Your stance has been recorded successfully.",
      });
    } catch (error: any) {
      console.error('Error saving stance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your stance.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyExtractedStance = () => {
    if (extractedResult) {
      setScore([extractedResult.score]);
      setShowExtractionPrompt(false);
    }
  };

  const formatSourceLinks = (sourceLinks: any) => {
    if (!sourceLinks) return [];
    if (Array.isArray(sourceLinks)) return sourceLinks;
    if (typeof sourceLinks === 'object' && sourceLinks.links) return sourceLinks.links;
    return [];
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

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Question Not Found</h1>
          <Link to="/feed">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/feed">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed
          </Button>
        </Link>
      </div>

      {/* Question Details */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <CardTitle className="text-2xl leading-tight">{question.title}</CardTitle>
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
          <div 
            className="prose prose-sm max-w-none mb-6"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(question.summary || '')
            }}
          />
          
          {formatSourceLinks(question.source_links).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Sources</h4>
              <div className="space-y-2">
                {formatSourceLinks(question.source_links).map((link: string, index: number) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {new URL(link).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stance Input */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Stance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stance Slider */}
          <div className="space-y-4">
            <label className="text-sm font-medium">
              Your Position: <span className="font-bold text-lg ml-2">
                {STANCE_LABELS[score[0].toString() as keyof typeof STANCE_LABELS]}
              </span>
            </label>
            <div className="px-4">
              <Slider
                value={score}
                onValueChange={setScore}
                max={2}
                min={-2}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Strongly Against</span>
                <span>Neutral</span>
                <span>Strongly For</span>
              </div>
            </div>
          </div>

          {/* Auto-extraction prompt */}
          {showExtractionPrompt && extractedResult && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                We detected you might lean toward "{STANCE_LABELS[extractedResult.score.toString() as keyof typeof STANCE_LABELS]}" 
                based on your text (confidence: {Math.round(extractedResult.confidence * 100)}%). 
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1"
                  onClick={applyExtractedStance}
                >
                  Use this suggestion
                </Button>
                , or keep your current selection.
              </AlertDescription>
            </Alert>
          )}

          {/* Rationale */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rationale <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              placeholder="Explain your reasoning... (max 2,000 characters)"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              maxLength={2000}
              className="min-h-24"
            />
            <div className="text-xs text-muted-foreground text-right">
              {rationale.length}/2,000
            </div>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Supporting Links <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              placeholder="Add links to support your stance (one per line)"
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                stance ? 'Update Stance' : 'Save Stance'
              )}
            </Button>
          </div>

          {/* Stance saved indicator */}
          {stance && (
            <div className="text-sm text-muted-foreground text-center pt-2 border-t">
              Last updated: {new Date(stance.updated_at).toLocaleDateString()} at{' '}
              {new Date(stance.updated_at).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}