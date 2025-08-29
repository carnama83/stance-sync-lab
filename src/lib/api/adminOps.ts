import { supabase } from "@/integrations/supabase/client";

export interface NewsSource {
  id: string;
  name: string;
  base_url: string;
  enabled: boolean;
  polling_minutes: number;
  last_status: string | null;
  last_latency_ms: number | null;
  updated_at: string;
}

export interface IngestionHealth {
  id: string;
  source_id: string | null;
  stage: 'ingest' | 'cluster' | 'generate';
  status: 'ok' | 'warn' | 'fail';
  info: string | null;
  created_at: string;
}

export interface JobRun {
  id: string;
  job_name: string;
  window_start: string | null;
  window_end: string | null;
  status: 'success' | 'fail';
  stats: Record<string, any>;
  created_at: string;
}

export const adminOpsApi = {
  // News Sources CRUD
  async getNewsSources() {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'GET',
      body: {},
    });

    if (error) throw error;
    return data as NewsSource[];
  },

  async createNewsSource(source: Omit<NewsSource, 'id' | 'updated_at'>) {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'POST',
      body: source,
    });

    if (error) throw error;
    return data as NewsSource;
  },

  async updateNewsSource(id: string, updates: Partial<NewsSource>) {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'PUT',
      body: updates,
    });

    if (error) throw error;
    return data as NewsSource;
  },

  async deleteNewsSource(id: string) {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'DELETE',
      body: { id },
    });

    if (error) throw error;
    return data;
  },

  // Health and Pipeline Status
  async getIngestionHealth() {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'GET',
      body: {},
    });

    if (error) throw error;
    return data.health as IngestionHealth[];
  },

  async logHealth(healthData: Omit<IngestionHealth, 'id' | 'created_at'>) {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'POST',
      body: healthData,
    });

    if (error) throw error;
    return data as IngestionHealth;
  },

  async getPipelineStatus() {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'GET',
      body: {},
    });

    if (error) throw error;
    return {
      health: data.health as IngestionHealth[],
      jobs: data.jobs as JobRun[]
    };
  },

  async retryPipeline(stage: string, sourceId?: string) {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'POST',
      body: { stage, source_id: sourceId },
    });

    if (error) throw error;
    return data;
  },

  // Admin Settings (J2 stubs)
  async getAdminSettings() {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'GET',
      body: {},
    });

    if (error) throw error;
    return data as Record<string, any>;
  },

  async updateAdminSettings(settings: Record<string, any>) {
    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'POST',
      body: settings,
    });

    if (error) throw error;
    return data;
  },

  // Dev functions with dev key
  async devGetNewsSources() {
    const devKey = import.meta.env.VITE_DEV_KEY;
    if (!devKey) throw new Error('Dev key not configured');

    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'GET',
      body: {},
      headers: {
        'x-dev-key': devKey
      }
    });

    if (error) throw error;
    return data as NewsSource[];
  },

  async devCreateNewsSource(source: Omit<NewsSource, 'id' | 'updated_at'>) {
    const devKey = import.meta.env.VITE_DEV_KEY;
    if (!devKey) throw new Error('Dev key not configured');

    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'POST',
      body: source,
      headers: {
        'x-dev-key': devKey
      }
    });

    if (error) throw error;
    return data as NewsSource;
  },

  async devUpdateAdminSettings(settings: Record<string, any>) {
    const devKey = import.meta.env.VITE_DEV_KEY;
    if (!devKey) throw new Error('Dev key not configured');

    const { data, error } = await supabase.functions.invoke('admin', {
      method: 'POST',
      body: settings,
      headers: {
        'x-dev-key': devKey
      }
    });

    if (error) throw error;
    return data;
  }
};