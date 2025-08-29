import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { generateExport, listExportJobs, getExportJob, openDownloadUrl, type ExportRequest, type ExportJob } from '@/lib/api/exports';

export default function Exports() {
  const [filters, setFilters] = useState<ExportRequest>({
    scope: 'topic',
    format: 'csv',
    k: 25
  });
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await listExportJobs();
      setJobs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load export jobs',
        variant: 'destructive'
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const job = await generateExport(filters);
      setJobs(prev => [job, ...prev]);
      toast({
        title: 'Export Started',
        description: 'Your export is being generated. You can download it once complete.',
      });
      
      // Start polling for this job
      pollJobStatus(job.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate export',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    if (pollingJobs.has(jobId)) return;
    
    setPollingJobs(prev => new Set(prev).add(jobId));
    
    const poll = async () => {
      try {
        const job = await getExportJob(jobId);
        setJobs(prev => prev.map(j => j.id === jobId ? job : j));
        
        if (job.status === 'complete' || job.status === 'failed') {
          setPollingJobs(prev => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });
          
          if (job.status === 'complete') {
            toast({
              title: 'Export Complete',
              description: 'Your export is ready for download.',
            });
          }
          return;
        }
        
        // Continue polling
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Error polling job status:', error);
        setPollingJobs(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      }
    };
    
    poll();
  };

  const handleDownload = (job: ExportJob) => {
    if (job.download_url) {
      openDownloadUrl(job.download_url);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      complete: 'default',
      failed: 'destructive',
      running: 'secondary',
      queued: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Research Exports</h1>
        <p className="text-muted-foreground mt-2">
          Generate anonymized, aggregated exports of stance data for research purposes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Export</CardTitle>
          <CardDescription>
            Configure your export parameters. All data is anonymized and k-anonymity enforced.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Select value={filters.scope} onValueChange={(value: any) => setFilters(prev => ({ ...prev, scope: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="topic">By Topic</SelectItem>
                  <SelectItem value="region">By Region</SelectItem>
                  <SelectItem value="topic_region">By Topic & Region</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filters.scope === 'topic' || filters.scope === 'topic_region') && (
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Economy, Healthcare"
                  value={filters.topic || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>
            )}

            {(filters.scope === 'region' || filters.scope === 'topic_region') && (
              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  placeholder="e.g., California, Mumbai, US"
                  value={filters.region || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                />
              </div>
            )}

            <div>
              <Label htmlFor="format">Format</Label>
              <Select value={filters.format} onValueChange={(value: any) => setFilters(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="k">K-Anonymity Threshold</Label>
              <Input
                id="k"
                type="number"
                min="1"
                max="100"
                value={filters.k || 25}
                onChange={(e) => setFilters(prev => ({ ...prev, k: parseInt(e.target.value) || 25 }))}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full md:w-auto">
            {loading ? 'Generating...' : 'Generate Export'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Jobs</CardTitle>
          <CardDescription>
            View and download your export jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No export jobs yet.</div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {job.filters.scope} export ({job.format.toUpperCase()})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(job.created_at).toLocaleDateString()}
                        {job.row_count && ` • ${job.row_count} records`}
                      </div>
                      {job.error && (
                        <div className="text-sm text-destructive mt-1">{job.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(job.status)}
                    {job.status === 'complete' && job.download_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(job)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
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