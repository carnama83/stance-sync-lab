import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/safe-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Shield, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { modTriage } from "@/lib/api/comments";

interface Report {
  id: string;
  comment_id: string;
  reason: string;
  severity: string;
  status: string;
  created_at: string;
  comments?: {
    body: string;
    is_hidden: boolean;
    user_id: string;
  } | null;
}

type FilterStatus = 'all' | 'open' | 'triaged' | 'actioned' | 'dismissed';
type FilterReason = 'all' | 'spam' | 'harassment' | 'hate' | 'misinformation' | 'other';
type FilterAge = 'all' | '24h' | '7d' | '30d';

export default function ModerationQueue() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('open');
  const [reasonFilter, setReasonFilter] = useState<FilterReason>('all');
  const [ageFilter, setAgeFilter] = useState<FilterAge>('all');
  
  // Dev key for development access
  const [devKey, setDevKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    reportId: string | null;
    commentId: string | null;
    currentAction: string | null;
  }>({
    open: false,
    reportId: null,
    commentId: null,
    currentAction: null
  });
  
  const [actionNotes, setActionNotes] = useState('');

  // Check authorization (in production, this would check JWT roles)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // For development, accept any authenticated user as moderator
        // In production, check for 'moderator' role in JWT
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, []);

  // Fetch reports
  useEffect(() => {
    if (!isAuthorized) return;
    fetchReports();
  }, [isAuthorized, statusFilter, reasonFilter, ageFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          comments (
            body,
            is_hidden,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (reasonFilter !== 'all') {
        query = query.eq('reason', reasonFilter);
      }
      
      if (ageFilter !== 'all') {
        let dateThreshold;
        switch (ageFilter) {
          case '24h':
            dateThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            break;
          case '7d':
            dateThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '30d':
            dateThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
        if (dateThreshold) {
          query = query.gte('created_at', dateThreshold);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Get user handles for the comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data
          .filter(report => report.comments?.user_id)
          .map(report => report.comments!.user_id))];
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_handle')
            .in('id', userIds);

          // Add user handles to reports
          const reportsWithHandles = data.map(report => ({
            ...report,
            user_handle: profiles?.find(p => p.id === report.comments?.user_id)?.display_handle || 'Anonymous'
          }));
          
          setReports(reportsWithHandles as any);
        } else {
          setReports(data as any);
        }
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load moderation queue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, newStatus?: 'open' | 'triaged' | 'actioned' | 'dismissed') => {
    if (!actionDialog.reportId || !actionDialog.commentId) return;
    
    setProcessing(actionDialog.reportId);
    try {
      await modTriage({
        reportId: actionDialog.reportId,
        action: action as any,
        commentId: actionDialog.commentId,
        notes: actionNotes.trim() || undefined,
        status: newStatus || 'actioned'
      });

      setActionDialog({ open: false, reportId: null, commentId: null, currentAction: null });
      setActionNotes('');
      
      // Refresh reports
      await fetchReports();
      
      toast({
        title: "Action completed",
        description: `Successfully ${action.replace('_', ' ')} the content.`,
      });
    } catch (error: any) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute moderation action.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'triaged':
        return <Badge variant="secondary">Triaged</Badge>;
      case 'actioned':
        return <Badge variant="default" className="bg-sky-700">Actioned</Badge>;
      case 'dismissed':
        return <Badge variant="outline">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    return severity === 'high' ? (
      <Badge variant="destructive" className="bg-red-600">High</Badge>
    ) : (
      <Badge variant="secondary">Normal</Badge>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Moderator Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need moderator permissions to access this page. 
                Please contact an administrator if you believe this is an error.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-sky-700" />
          Moderation Queue
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and moderate reported content to maintain community standards.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(value: FilterStatus) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="actioned">Actioned</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <Select value={reasonFilter} onValueChange={(value: FilterReason) => setReasonFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="hate">Hate Speech</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Age</label>
              <Select value={ageFilter} onValueChange={(value: FilterAge) => setAgeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reports match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        {getSeverityBadge(report.severity)}
                        <Badge variant="outline" className="capitalize">
                          {report.reason.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Mock AI Score: {Math.floor(Math.random() * 100)} {/* H2 stub */}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Reported on {new Date(report.created_at).toLocaleDateString()} at{' '}
                        {new Date(report.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog
                        open={actionDialog.open && actionDialog.reportId === report.id}
                        onOpenChange={(open) => setActionDialog({
                          open,
                          reportId: open ? report.id : null,
                          commentId: open ? report.comment_id : null,
                          currentAction: null
                        })}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Take Action
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Moderation Action</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Action Notes (optional)</label>
                              <Textarea
                                placeholder="Add notes about your decision..."
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                className="min-h-20"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="destructive"
                                onClick={() => handleAction('hide_comment')}
                                disabled={processing === report.id}
                                className="flex items-center gap-2"
                              >
                                <EyeOff className="h-4 w-4" />
                                Hide Comment
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => handleAction('restore_comment')}
                                disabled={processing === report.id}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Restore Comment
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => handleAction('', 'triaged')}
                                disabled={processing === report.id}
                                className="flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark Triaged
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => handleAction('', 'dismissed')}
                                disabled={processing === report.id}
                                className="flex items-center gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                Dismiss Report
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {/* Comment Content */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      Comment by {(report as any).user_handle}
                      {report.comments?.is_hidden && (
                        <Badge variant="destructive" className="ml-2">Hidden</Badge>
                      )}
                    </div>
                    <div className="text-sm max-w-none">
                      {report.comments?.body ? (
                        report.comments.body.length > 200 ? 
                          `${report.comments.body.substring(0, 200)}...` : 
                          report.comments.body
                      ) : 'Comment not found'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}