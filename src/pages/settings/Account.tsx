import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Trash2, 
  AlertTriangle, 
  Eye, 
  Download, 
  Shield,
  Clock,
  CheckCircle,
  XCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  initiateDeletion, 
  confirmDeletion, 
  cancelDeletion, 
  getDeletionRequest,
  listConsentLogs,
  setConsent,
  type DeletionRequest,
  type ConsentLog 
} from "@/lib/api/account";
import { supabase } from "@/integrations/supabase/client";

export default function Account() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [confirmToken, setConfirmToken] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate('/auth/signup');
        return;
      }
      
      await loadData();
    };
    checkAuth();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deletionData, consentData] = await Promise.all([
        getDeletionRequest(),
        listConsentLogs()
      ]);
      
      setDeletionRequest(deletionData);
      setConsentLogs(consentData);
    } catch (error: any) {
      console.error('Error loading account data:', error);
      toast({
        title: "Error",
        description: "Failed to load account settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateDeletion = async () => {
    setProcessing(true);
    try {
      const result = await initiateDeletion();
      await loadData();
      toast({
        title: "Deletion Scheduled",
        description: `Your account will be deleted on ${new Date(result.delete_after).toLocaleDateString()}. Check your notifications for the confirmation token.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate deletion.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!confirmToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter the confirmation token.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await confirmDeletion(confirmToken);
      await loadData();
      setConfirmToken('');
      toast({
        title: "Deletion Confirmed",
        description: "Your account deletion has been confirmed and will be processed after the grace period.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm deletion.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelDeletion = async () => {
    setProcessing(true);
    try {
      await cancelDeletion();
      await loadData();
      toast({
        title: "Deletion Cancelled",
        description: "Your account deletion has been cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel deletion.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleConsentToggle = async (consentType: string, granted: boolean) => {
    try {
      await setConsent({
        consent_type: consentType,
        version: 'v1.0',
        granted
      });
      await loadData();
      toast({
        title: "Consent Updated",
        description: `Your ${consentType} consent has been ${granted ? 'granted' : 'revoked'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update consent.",
        variant: "destructive",
      });
    }
  };

  const getLatestConsent = (type: string): boolean => {
    const logs = consentLogs.filter(log => log.consent_type === type);
    return logs.length > 0 ? logs[0].granted : true; // Default to true
  };

  const handleExportData = () => {
    navigate('/research/exports');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getDeletionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'confirmed': return 'bg-destructive text-destructive-foreground';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      case 'purged': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, privacy preferences, and data.
          </p>
        </div>

        {/* Account Deletion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {deletionRequest && deletionRequest.status !== 'cancelled' && deletionRequest.status !== 'purged' ? (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getDeletionStatusColor(deletionRequest.status)}>
                          {deletionRequest.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm">
                          Scheduled for: {new Date(deletionRequest.delete_after).toLocaleDateString()}
                        </span>
                      </div>
                      {deletionRequest.status === 'pending' && (
                        <p className="text-sm">
                          Your account deletion is scheduled. Use the confirmation token from your notifications to confirm the deletion.
                        </p>
                      )}
                      {deletionRequest.status === 'confirmed' && (
                        <p className="text-sm">
                          Your account deletion has been confirmed and will be processed after the grace period expires.
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {deletionRequest.status === 'pending' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirmation Token</label>
                      <Input
                        type="text"
                        placeholder="Enter confirmation token from notifications"
                        value={confirmToken}
                        onChange={(e) => setConfirmToken(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        onClick={handleConfirmDeletion}
                        disabled={processing}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm Deletion
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelDeletion}
                        disabled={processing}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Deletion
                      </Button>
                    </div>
                  </div>
                )}

                {deletionRequest.status === 'confirmed' && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelDeletion}
                    disabled={processing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Deletion
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                  Your account will be scheduled for deletion with a 14-day grace period.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleInitiateDeletion}
                  disabled={processing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Request Account Deletion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">IP-based Region Inference</h4>
                  <p className="text-sm text-muted-foreground">
                    Allow us to infer your general region from your IP address for location-based insights.
                  </p>
                </div>
                <Switch
                  checked={getLatestConsent('ip_inference')}
                  onCheckedChange={(checked) => handleConsentToggle('ip_inference', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Consent History
              </h4>
              {consentLogs.length > 0 ? (
                <div className="space-y-2">
                  {consentLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{log.consent_type}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant={log.granted ? "default" : "secondary"}>
                        {log.granted ? 'Granted' : 'Revoked'}
                      </Badge>
                    </div>
                  ))}
                  {consentLogs.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      And {consentLogs.length - 5} more entries...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No consent changes recorded.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export My Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download a copy of all your data in our system, including your stances, comments, and profile information.
              </p>
              <Button onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" />
                Export My Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Account deletion is permanent and cannot be reversed. 
            Make sure to export your data before proceeding with deletion if you want to keep a copy.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}