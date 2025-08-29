import { useState, useEffect } from "react";
import { Plus, Settings2, Activity, RefreshCw, Edit, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { adminOpsApi, type NewsSource, type IngestionHealth, type JobRun } from "@/lib/api/adminOps";

export default function IngestionSettings() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [health, setHealth] = useState<IngestionHealth[]>([]);
  const [jobs, setJobs] = useState<JobRun[]>([]);
  const [prompts, setPrompts] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [newSource, setNewSource] = useState<Partial<NewsSource>>({
    name: "",
    base_url: "",
    enabled: true,
    polling_minutes: 60
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load sources using dev API
      const sourcesData = await adminOpsApi.devGetNewsSources();
      setSources(sourcesData);

      // Load pipeline status
      const pipelineData = await adminOpsApi.getPipelineStatus();
      setHealth(pipelineData.health);
      setJobs(pipelineData.jobs);

      // Load admin settings
      const settings = await adminOpsApi.getAdminSettings();
      setPrompts(settings.prompts || "");
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSource = async () => {
    try {
      if (!newSource.name || !newSource.base_url) {
        toast({
          title: "Validation Error",
          description: "Name and URL are required",
          variant: "destructive"
        });
        return;
      }

      const created = await adminOpsApi.devCreateNewsSource({
        name: newSource.name,
        base_url: newSource.base_url,
        enabled: newSource.enabled ?? true,
        polling_minutes: newSource.polling_minutes ?? 60,
        last_status: null,
        last_latency_ms: null
      });

      setSources(prev => [...prev, created]);
      setNewSource({ name: "", base_url: "", enabled: true, polling_minutes: 60 });
      
      toast({
        title: "Success",
        description: "News source created successfully"
      });
    } catch (error) {
      console.error('Error creating source:', error);
      toast({
        title: "Error",
        description: "Failed to create news source",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSource = async (id: string, updates: Partial<NewsSource>) => {
    try {
      const updated = await adminOpsApi.updateNewsSource(id, updates);
      setSources(prev => prev.map(s => s.id === id ? updated : s));
      setEditingSource(null);
      
      toast({
        title: "Success",
        description: "News source updated successfully"
      });
    } catch (error) {
      console.error('Error updating source:', error);
      toast({
        title: "Error",
        description: "Failed to update news source",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await adminOpsApi.deleteNewsSource(id);
      setSources(prev => prev.filter(s => s.id !== id));
      
      toast({
        title: "Success",
        description: "News source deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: "Error",
        description: "Failed to delete news source",
        variant: "destructive"
      });
    }
  };

  const handleSavePrompts = async () => {
    try {
      await adminOpsApi.devUpdateAdminSettings({ prompts });
      
      toast({
        title: "Success",
        description: "Prompts saved successfully"
      });
    } catch (error) {
      console.error('Error saving prompts:', error);
      toast({
        title: "Error",
        description: "Failed to save prompts",
        variant: "destructive"
      });
    }
  };

  const handleRetryPipeline = async (stage: string, sourceId?: string) => {
    try {
      await adminOpsApi.retryPipeline(stage, sourceId);
      await loadData(); // Refresh data
      
      toast({
        title: "Success",
        description: `Pipeline retry initiated for ${stage}`
      });
    } catch (error) {
      console.error('Error retrying pipeline:', error);
      toast({
        title: "Error",
        description: "Failed to retry pipeline",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'active':
      case 'success':
        return 'bg-green-500 text-white';
      case 'warn':
        return 'bg-yellow-500 text-white';
      case 'fail':
      case 'failing':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings2 className="h-8 w-8 text-sky" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ingestion & Operations</h1>
            <p className="text-muted-foreground">Manage news sources, health monitoring, and AI settings</p>
          </div>
        </div>

        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sources" className="data-[state=active]:bg-sky data-[state=active]:text-sky-foreground">
              Sources ({sources.length})
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-sky data-[state=active]:text-sky-foreground">
              Health
            </TabsTrigger>
            <TabsTrigger value="prompts" className="data-[state=active]:bg-sky data-[state=active]:text-sky-foreground">
              AI Prompts
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-sky data-[state=active]:text-sky-foreground">
              Pipeline
            </TabsTrigger>
          </TabsList>

          {/* Sources Tab */}
          <TabsContent value="sources" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add News Source
                  </CardTitle>
                  <CardDescription>
                    Configure new sources for content ingestion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Source Name</Label>
                      <Input
                        id="name"
                        value={newSource.name || ""}
                        onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Tech News RSS"
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">Base URL</Label>
                      <Input
                        id="url"
                        value={newSource.base_url || ""}
                        onChange={(e) => setNewSource(prev => ({ ...prev, base_url: e.target.value }))}
                        placeholder="https://example.com/rss"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={newSource.enabled}
                        onCheckedChange={(checked) => setNewSource(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">Enabled</Label>
                    </div>
                    <div>
                      <Label htmlFor="polling">Polling (minutes)</Label>
                      <Input
                        id="polling"
                        type="number"
                        value={newSource.polling_minutes}
                        onChange={(e) => setNewSource(prev => ({ ...prev, polling_minutes: parseInt(e.target.value) }))}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateSource} className="bg-sky hover:bg-sky-dark text-sky-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Source
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configured Sources</CardTitle>
                  <CardDescription>Manage existing news sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Polling</TableHead>
                        <TableHead>Latency</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sources.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell className="font-medium">{source.name}</TableCell>
                          <TableCell className="text-muted-foreground">{source.base_url}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(source.last_status || 'unknown')}>
                              {source.enabled ? (source.last_status || 'unknown') : 'disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell>{source.polling_minutes}m</TableCell>
                          <TableCell>
                            {source.last_latency_ms ? `${source.last_latency_ms}ms` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSource(source)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSource(source.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Ingestion Health
                </CardTitle>
                <CardDescription>Monitor pipeline health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Info</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {health.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.stage}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.info || '-'}</TableCell>
                        <TableCell>
                          {new Date(item.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Prompts & Guardrails (J2 Stub)</CardTitle>
                <CardDescription>
                  Configure AI prompts and safety guardrails (UI only - no runtime effects yet)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompts">System Prompts</Label>
                  <Textarea
                    id="prompts"
                    value={prompts}
                    onChange={(e) => setPrompts(e.target.value)}
                    placeholder="Enter AI system prompts and guardrails..."
                    className="min-h-40"
                  />
                </div>
                <Button onClick={handleSavePrompts} className="bg-sky hover:bg-sky-dark text-sky-foreground">
                  <Save className="h-4 w-4 mr-2" />
                  Save Prompts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Pipeline Status & Recovery (J3 Stub)
                  </CardTitle>
                  <CardDescription>Monitor job runs and retry failed operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Button
                      onClick={() => handleRetryPipeline('ingest')}
                      variant="outline"
                      className="border-sky text-sky hover:bg-sky-light"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Ingest
                    </Button>
                    <Button
                      onClick={() => handleRetryPipeline('cluster')}
                      variant="outline"
                      className="border-sky text-sky hover:bg-sky-light"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Cluster
                    </Button>
                    <Button
                      onClick={() => handleRetryPipeline('generate')}
                      variant="outline"
                      className="border-sky text-sky hover:bg-sky-light"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Generate
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Window</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.job_name}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {job.window_start && job.window_end
                              ? `${new Date(job.window_start).toLocaleDateString()} - ${new Date(job.window_end).toLocaleDateString()}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-xs">
                            {Object.entries(job.stats || {}).map(([key, value]) => (
                              <div key={key}>{key}: {String(value)}</div>
                            ))}
                          </TableCell>
                          <TableCell>
                            {new Date(job.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Source Dialog */}
      {editingSource && (
        <Dialog open={true} onOpenChange={() => setEditingSource(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit News Source</DialogTitle>
              <DialogDescription>Update source configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Source Name</Label>
                <Input
                  id="edit-name"
                  value={editingSource.name}
                  onChange={(e) => setEditingSource(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-url">Base URL</Label>
                <Input
                  id="edit-url"
                  value={editingSource.base_url}
                  onChange={(e) => setEditingSource(prev => prev ? { ...prev, base_url: e.target.value } : null)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-enabled"
                  checked={editingSource.enabled}
                  onCheckedChange={(checked) => setEditingSource(prev => prev ? { ...prev, enabled: checked } : null)}
                />
                <Label htmlFor="edit-enabled">Enabled</Label>
              </div>
              <div>
                <Label htmlFor="edit-polling">Polling (minutes)</Label>
                <Input
                  id="edit-polling"
                  type="number"
                  value={editingSource.polling_minutes}
                  onChange={(e) => setEditingSource(prev => prev ? { ...prev, polling_minutes: parseInt(e.target.value) } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSource(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateSource(editingSource.id, editingSource)}
                className="bg-sky hover:bg-sky-dark text-sky-foreground"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}