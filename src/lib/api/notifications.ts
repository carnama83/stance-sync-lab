import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: 'weekly_digest' | 'stance_shift' | 'system';
  title: string;
  body: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationSettings {
  user_id: string;
  weekly_digest: boolean;
  alerts_enabled: boolean;
  channel_inapp: boolean;
  channel_email: boolean;
  threshold_shift: number;
  updated_at: string;
}

export const notificationsApi = {
  async listNotifications({ onlyUnread = false }: { onlyUnread?: boolean } = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (onlyUnread) {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Notification[];
  },

  async markRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getNotificationSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Ensure settings exist
    await supabase.rpc('ensure_notif_settings', { p_user: user.id });

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data as NotificationSettings;
  },

  async updateNotificationSettings(settings: Partial<NotificationSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Dev functions to trigger edge functions
  async runWeeklyDigestDEV() {
    const devKey = import.meta.env.VITE_DEV_KEY;
    if (!devKey) throw new Error('Dev key not configured');

    const { data, error } = await supabase.functions.invoke('digest', {
      method: 'POST',
      body: {},
      headers: {
        'x-dev-key': devKey
      }
    });

    if (error) throw error;
    return data;
  },

  async runShiftScanDEV() {
    const devKey = import.meta.env.VITE_DEV_KEY;
    if (!devKey) throw new Error('Dev key not configured');

    const { data, error } = await supabase.functions.invoke('alerts', {
      method: 'POST',
      body: {},
      headers: {
        'x-dev-key': devKey
      }
    });

    if (error) throw error;
    return data;
  }
};