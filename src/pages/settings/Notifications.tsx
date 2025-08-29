import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { Bell, Mail, Smartphone, Plus, X, Hash, MapPin, FileText } from 'lucide-react';
import { 
  getNotificationSettings, 
  updateNotificationSettings, 
  listSubscriptions, 
  upsertSubscription, 
  deleteSubscription,
  type NotificationSubscription 
} from '@/lib/api/prefs';

export default function Notifications() {
  const [settings, setSettings] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    s_type: 'topic' as 'topic' | 'region' | 'question',
    s_key: '',
    enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, subscriptionsData] = await Promise.all([
        getNotificationSettings(),
        listSubscriptions()
      ]);
      setSettings(settingsData);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updated = await updateNotificationSettings(settings);
      setSettings(updated);
      toast({
        title: 'Settings Saved',
        description: 'Your notification settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save notification settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!newSubscription.s_key.trim()) return;
    
    try {
      const created = await upsertSubscription(newSubscription);
      setSubscriptions(prev => [created, ...prev.filter(s => 
        !(s.s_type === created.s_type && s.s_key === created.s_key)
      )]);
      setNewSubscription({ s_type: 'topic', s_key: '', enabled: true });
      toast({
        title: 'Subscription Added',
        description: 'You will receive notifications for this item.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add subscription',
        variant: 'destructive'
      });
    }
  };

  const handleToggleSubscription = async (subscription: NotificationSubscription) => {
    try {
      const updated = await upsertSubscription({
        s_type: subscription.s_type,
        s_key: subscription.s_key,
        enabled: !subscription.enabled
      });
      setSubscriptions(prev => prev.map(s => 
        s.s_type === subscription.s_type && s.s_key === subscription.s_key ? updated : s
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveSubscription = async (subscription: NotificationSubscription) => {
    try {
      await deleteSubscription(subscription.s_type, subscription.s_key);
      setSubscriptions(prev => prev.filter(s => 
        !(s.s_type === subscription.s_type && s.s_key === subscription.s_key)
      ));
      toast({
        title: 'Subscription Removed',
        description: 'You will no longer receive notifications for this item.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove subscription',
        variant: 'destructive'
      });
    }
  };

  const getSubscriptionIcon = (type: string) => {
    switch (type) {
      case 'topic':
        return <Hash className="h-4 w-4" />;
      case 'region':
        return <MapPin className="h-4 w-4" />;
      case 'question':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading notification settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-destructive">Failed to load notification settings</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Control how and when you receive notifications about stance changes and updates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            General Notifications
          </CardTitle>
          <CardDescription>
            Configure your overall notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="alerts-enabled" className="text-base font-medium">
                Alerts Enabled
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for significant stance shifts
              </p>
            </div>
            <Switch
              id="alerts-enabled"
              checked={settings.alerts_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, alerts_enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-digest" className="text-base font-medium">
                Weekly Digest
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of stance changes
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={settings.weekly_digest}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weekly_digest: checked }))}
            />
          </div>

          <div>
            <Label className="text-base font-medium">Threshold for Stance Shift Alerts</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Minimum change required to trigger an alert ({Math.round(settings.threshold_shift * 100)}%)
            </p>
            <Slider
              value={[settings.threshold_shift]}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, threshold_shift: value }))}
              max={1}
              min={0.05}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="channel-inapp" className="text-base font-medium">
                  In-App Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications within the application
                </p>
              </div>
            </div>
            <Switch
              id="channel-inapp"
              checked={settings.channel_inapp}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, channel_inapp: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="channel-email" className="text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications to your email address
                </p>
              </div>
            </div>
            <Switch
              id="channel-email"
              checked={settings.channel_email}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, channel_email: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Subscriptions</CardTitle>
          <CardDescription>
            Subscribe to specific topics, regions, or questions for targeted notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Select 
              value={newSubscription.s_type} 
              onValueChange={(value: any) => setNewSubscription(prev => ({ ...prev, s_type: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="topic">Topic</SelectItem>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={`Enter ${newSubscription.s_type}...`}
              value={newSubscription.s_key}
              onChange={(e) => setNewSubscription(prev => ({ ...prev, s_key: e.target.value }))}
              className="flex-1"
            />
            <Button onClick={handleAddSubscription} disabled={!newSubscription.s_key.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {subscriptions.length > 0 ? (
            <div className="space-y-2">
              {subscriptions.map((subscription) => (
                <div 
                  key={`${subscription.s_type}-${subscription.s_key}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getSubscriptionIcon(subscription.s_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subscription.s_key}</span>
                        <Badge variant="outline" className="text-xs">
                          {subscription.s_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={subscription.enabled}
                      onCheckedChange={() => handleToggleSubscription(subscription)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveSubscription(subscription)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No custom subscriptions yet. Add one above to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}