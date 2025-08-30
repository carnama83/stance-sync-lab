import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Globe, Edit, Trash2 } from "lucide-react";

type NewsSource = {
  id: string;
  name: string;
  base_url: string | null;
  enabled: boolean;
  last_status: string | null;
  polling_minutes: number | null;
  updated_at: string;
};

export default function NewsSourcesManagement() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourcePolling, setNewSourcePolling] = useState(60);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from("news_sources")
        .select("*")
        .order("name");

      if (error) throw error;
      setSources(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async () => {
    try {
      const { error } = await supabase
        .from("news_sources")
        .insert([{
          name: newSourceName,
          base_url: newSourceUrl,
          polling_minutes: newSourcePolling,
          enabled: true
        }]);

      if (error) throw error;
      
      // Reset form
      setNewSourceName("");
      setNewSourceUrl("");
      setNewSourcePolling(60);
      setIsAddDialogOpen(false);
      
      // Refresh list
      fetchSources();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleSourceStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("news_sources")
        .update({ enabled: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchSources();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from("news_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchSources();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading news sources...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <h2 className="text-xl font-semibold">News Sources Management</h2>
          <Badge variant="secondary">{sources.length} sources</Badge>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add News Source</DialogTitle>
              <DialogDescription>
                Add a new news source to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="source-name" className="text-sm font-medium">Name</label>
                <Input
                  id="source-name"
                  placeholder="BBC News"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="source-url" className="text-sm font-medium">Base URL</label>
                <Input
                  id="source-url"
                  placeholder="https://feeds.bbci.co.uk/news/rss.xml"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="polling-minutes" className="text-sm font-medium">Polling Interval (minutes)</label>
                <Input
                  id="polling-minutes"
                  type="number"
                  placeholder="60"
                  value={newSourcePolling}
                  onChange={(e) => setNewSourcePolling(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleAddSource} className="w-full">
                Add Source
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <Globe className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-sm text-muted-foreground">{source.base_url}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={source.enabled ? "default" : "secondary"}>
                      {source.enabled ? "Active" : "Disabled"}
                    </Badge>
                    {source.last_status && (
                      <Badge variant="outline">{source.last_status}</Badge>
                    )}
                    {source.polling_minutes && (
                      <span className="text-xs text-muted-foreground">
                        Every {source.polling_minutes}min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSourceStatus(source.id, source.enabled)}
                >
                  {source.enabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSource(source.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sources.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No news sources configured</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}