import { supabase } from "@/integrations/supabase/client";

export interface ExportRequest {
  scope: 'topic' | 'region' | 'topic_region';
  topic?: string;
  region?: string;
  k?: number;
  format: 'csv' | 'json';
  date_range?: { from: string; to: string };
}

export interface ExportJob {
  id: string;
  requested_by: string;
  format: string;
  filters: any;
  k_threshold: number;
  status: 'queued' | 'running' | 'complete' | 'failed';
  file_path?: string;
  row_count?: number;
  error?: string;
  created_at: string;
  completed_at?: string;
  download_url?: string;
}

export async function generateExport(params: ExportRequest): Promise<ExportJob> {
  const { data, error } = await supabase.functions.invoke('exports/generate', {
    body: params
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate export');
  }

  return data;
}

export async function getExportJob(id: string): Promise<ExportJob> {
  const { data, error } = await supabase.functions.invoke(`exports/jobs/${id}`, {
    method: 'GET'
  });

  if (error) {
    throw new Error(error.message || 'Failed to get export job');
  }

  return data;
}

export async function listExportJobs(): Promise<ExportJob[]> {
  const { data, error } = await supabase
    .from('export_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to list export jobs');
  }

  return (data || []) as ExportJob[];
}

export function openDownloadUrl(url: string) {
  window.open(url, '_blank');
}