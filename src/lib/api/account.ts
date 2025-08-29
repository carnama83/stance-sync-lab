import { supabase } from "@/integrations/supabase/client";

export interface ConsentLog {
  id: string;
  user_id: string;
  consent_type: string;
  version: string;
  granted: boolean;
  created_at: string;
}

export interface DeletionRequest {
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'purged';
  confirm_token: string;
  requested_at: string;
  delete_after: string;
  confirmed_at?: string;
  purged_at?: string;
  error?: string;
}

export async function initiateDeletion(): Promise<{ success: boolean; message: string; delete_after: string; confirm_token: string }> {
  const { data, error } = await supabase.functions.invoke('account/delete/initiate', {
    method: 'POST'
  });

  if (error) {
    throw new Error(error.message || 'Failed to initiate deletion');
  }

  return data;
}

export async function confirmDeletion(token: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('account/delete/confirm', {
    method: 'POST',
    body: { token }
  });

  if (error) {
    throw new Error(error.message || 'Failed to confirm deletion');
  }

  return data;
}

export async function cancelDeletion(): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('account/delete/cancel', {
    method: 'POST'
  });

  if (error) {
    throw new Error(error.message || 'Failed to cancel deletion');
  }

  return data;
}

export async function listConsentLogs(): Promise<ConsentLog[]> {
  const { data, error } = await supabase
    .from('consent_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to list consent logs');
  }

  return (data || []) as ConsentLog[];
}

export async function setConsent(params: { 
  consent_type: string; 
  version: string; 
  granted: boolean; 
}): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('account/consent', {
    method: 'POST',
    body: params
  });

  if (error) {
    throw new Error(error.message || 'Failed to set consent');
  }

  return data;
}

export async function getDeletionRequest(): Promise<DeletionRequest | null> {
  const { data, error } = await supabase
    .from('deletion_requests')
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to get deletion request');
  }

  return data as DeletionRequest | null;
}