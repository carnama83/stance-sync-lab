import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ExternalLink, ArrowLeft, Info, MessageCircle, ThumbsUp, Flag, AlertTriangle } from "lucide-react";
import { getUserStance, upsertStance, type StanceData } from "@/features/stance/api";
import { extractStance } from "@/features/stance/nlp/extract";
import { sanitizeHtml } from "@/lib/utils/sanitizer";
import { useToast } from "@/hooks/use-toast";
import { listComments, createComment, toggleUpvote, fileReport, checkToxicity, type Comment, type ReportData } from "@/lib/api/comments";
import type { Database } from "@/integrations/supabase/types";
import type { Stance } from "@/features/stance/api";
import InlineInsights from "@/components/insights/InlineInsights";

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
  const [profile, setProfile] = useState<any>(null);
  
  // Form state
  const [score, setScore] = useState([0]);
  const [rationale, setRationale] = useState('');
  const [linksText, setLinksText] = useState('');
  const [extractedResult, setExtractedResult] = useState<{score: number; confidence: number} | null>(null);
  const [showExtractionPrompt, setShowExtractionPrompt] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSort, setCommentSort] = useState<'helpful' | 'latest'>('helpful');
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [toxicityWarning, setToxicityWarning] = useState<{show: boolean; score: number} | null>(null);
  const [reportDialog, setReportDialog] = useState<{open: boolean; commentId: string | null}>({open: false, commentId: null});

  // Check authentication and load profile
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate('/auth/signup');
        return;
      }
      
      // Load user profile for location data
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('city, state, country_iso')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
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

  // Fetch comments when question changes
  useEffect(() => {
    if (!question) return;

    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const commentsData = await listComments(question.id, { sort: commentSort });
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [question, commentSort]);

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

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !question || !user) return;

    // Check for toxicity
    const toxicityCheck = checkToxicity(newComment);
    if (toxicityCheck.isToxic) {
      setToxicityWarning({ show: true, score: toxicityCheck.score });
      return;
    }

    setCommentSubmitting(true);
    try {
      await createComment({
        questionId: question.id,
        body: newComment.trim(),
        toxicityFlag: toxicityCheck.score > 0.3 // Flag if moderate toxicity
      });

      setNewComment('');
      setToxicityWarning(null);
      
      // Refresh comments
      const updatedComments = await listComments(question.id, { sort: commentSort });
      setComments(updatedComments);

      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully.",
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment.",
        variant: "destructive",
      });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleUpvoteToggle = async (commentId: string) => {
    if (!user) return;
    
    try {
      await toggleUpvote(commentId);
      
      // Refresh comments to update vote counts
      const updatedComments = await listComments(question!.id, { sort: commentSort });
      setComments(updatedComments);
    } catch (error: any) {
      console.error('Error toggling upvote:', error);
      toast({
        title: "Error",
        description: "Failed to update vote.",
        variant: "destructive",
      });
    }
  };

  const handleReport = async (reason: string, severity: 'normal' | 'high') => {
    if (!reportDialog.commentId || !user) return;
    
    try {
      await fileReport({
        commentId: reportDialog.commentId,
        reason,
        severity
      });

      setReportDialog({open: false, commentId: null});
      
      toast({
        title: "Report submitted",
        description: "Thank you for reporting this content. Our moderators will review it.",
      });
    } catch (error: any) {
      console.error('Error reporting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit report.",
        variant: "destructive",
      });
    }
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

      {/* Inline Insights */}
      {question && profile && (
        <InlineInsights
          questionId={question.id}
          myCity={profile.city}
          myState={profile.state}
          myCountry={profile.country_iso}
        />
      )}

      {/* Comments Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({comments.length})
            </CardTitle>
            <Select value={commentSort} onValueChange={(value: 'helpful' | 'latest') => setCommentSort(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="helpful">Most Helpful</SelectItem>
                <SelectItem value="latest">Latest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Form */}
          <div className="space-y-4">
            <Textarea
              placeholder="Share your thoughts on this topic... (Be respectful and constructive)"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setToxicityWarning(null);
              }}
              className="min-h-20"
              maxLength={1000}
            />
            
            {toxicityWarning?.show && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Your comment may contain language that could be perceived as toxic or inappropriate 
                  (confidence: {Math.round(toxicityWarning.score * 100)}%). Please consider revising 
                  to maintain a constructive discussion.
                  <div className="mt-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setToxicityWarning(null)}
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Edit Comment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCommentSubmit}
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Post Anyway
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/1,000 characters
              </span>
              <Button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || commentSubmitting}
                className="bg-sky-700 hover:bg-sky-800"
              >
                {commentSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {commentsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-muted-foreground mt-2">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border border-sky-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-sky-900">
                        {comment.user_handle}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()} at{' '}
                        {new Date(comment.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <Dialog
                      open={reportDialog.open && reportDialog.commentId === comment.id}
                      onOpenChange={(open) => setReportDialog({open, commentId: open ? comment.id : null})}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
                          <Flag className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Report Comment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Please select the reason for reporting this comment:
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { value: 'spam', label: 'Spam or irrelevant content' },
                              { value: 'harassment', label: 'Harassment or bullying' },
                              { value: 'hate', label: 'Hate speech or discrimination' },
                              { value: 'misinformation', label: 'False or misleading information' },
                              { value: 'other', label: 'Other violation' }
                            ].map(reason => (
                              <div key={reason.value} className="space-y-2">
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left"
                                  onClick={() => handleReport(reason.value, 'normal')}
                                >
                                  {reason.label}
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleReport('harassment', 'high')}
                          >
                            Report as High Severity
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="text-sm">
                    {comment.toxicity_flag && (
                      <Badge variant="secondary" className="mb-2 bg-amber-100 text-amber-800">
                        Content warning
                      </Badge>
                    )}
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(comment.body)
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvoteToggle(comment.id)}
                      className={`text-muted-foreground hover:text-sky-700 ${
                        comment.user_upvoted ? 'text-sky-700 bg-sky-50' : ''
                      }`}
                      disabled={!user}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {comment.upvote_count || 0}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}