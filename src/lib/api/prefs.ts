import { supabase } from "@/integrations/supabase/client";

export interface PrivacySettings {
  user_id: string;
  is_public_profile: boolean;
  show_location: boolean;
  show_age: boolean;
  updated_at: string;
}

export interface NotificationSubscription {
  user_id: string;
  s_type: 'topic' | 'region' | 'question';
  s_key: string;
  enabled: boolean;
  created_at: string;
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found, create default
      return await createDefaultPrivacySettings();
    }
    throw new Error(error.message || 'Failed to get privacy settings');
  }

  return data;
}

export async function updatePrivacySettings(updates: Partial<Omit<PrivacySettings, 'user_id' | 'updated_at'>>): Promise<PrivacySettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('privacy_settings')
    .upsert({
      user_id: user.id,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update privacy settings');
  }

  return data;
}

async function createDefaultPrivacySettings(): Promise<PrivacySettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const defaults = {
    user_id: user.id,
    is_public_profile: false,
    show_location: true,
    show_age: false
  };

  const { data, error } = await supabase
    .from('privacy_settings')
    .insert(defaults)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create privacy settings');
  }

  return data;
}

export async function getNotificationSettings() {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to get notification settings');
  }

  return data;
}

export async function updateNotificationSettings(updates: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: user.id,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update notification settings');
  }

  return data;
}

export async function listSubscriptions(): Promise<NotificationSubscription[]> {
  const { data, error } = await supabase
    .from('notification_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to list subscriptions');
  }

  return data || [];
}

export async function upsertSubscription(subscription: {
  s_type: 'topic' | 'region' | 'question';
  s_key: string;
  enabled: boolean;
}): Promise<NotificationSubscription> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notification_subscriptions')
    .upsert({
      user_id: user.id,
      ...subscription,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update subscription');
  }

  return data;
}

export async function deleteSubscription(s_type: 'topic' | 'region' | 'question', s_key: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('notification_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('s_type', s_type)
    .eq('s_key', s_key);

  if (error) {
    throw new Error(error.message || 'Failed to delete subscription');
  }
}