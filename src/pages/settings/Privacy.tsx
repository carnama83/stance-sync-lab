import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Shield, Eye, MapPin, Calendar } from 'lucide-react';
import { getPrivacySettings, updatePrivacySettings, type PrivacySettings } from '@/lib/api/prefs';

export default function Privacy() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getPrivacySettings();
      setSettings(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load privacy settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updated = await updatePrivacySettings({
        is_public_profile: settings.is_public_profile,
        show_location: settings.show_location,
        show_age: settings.show_age
      });
      setSettings(updated);
      toast({
        title: 'Settings Saved',
        description: 'Your privacy settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save privacy settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof PrivacySettings, value: boolean) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading privacy settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-destructive">Failed to load privacy settings</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Privacy Settings</h1>
        <p className="text-muted-foreground mt-2">
          Control your profile visibility and what information is shared.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Choose how your profile appears to other users. By default, profiles are anonymous.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="public-profile" className="text-base font-medium">
                  Public Profile
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your profile information
                </p>
              </div>
            </div>
            <Switch
              id="public-profile"
              checked={settings.is_public_profile}
              onCheckedChange={(checked) => handleToggle('is_public_profile', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="show-location" className="text-base font-medium">
                  Show Location
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your city, state, and country (coarse location only)
                </p>
              </div>
            </div>
            <Switch
              id="show-location"
              checked={settings.show_location}
              onCheckedChange={(checked) => handleToggle('show_location', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="show-age" className="text-base font-medium">
                  Show Age
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your calculated age based on date of birth
                </p>
              </div>
            </div>
            <Switch
              id="show-age"
              checked={settings.show_age}
              onCheckedChange={(checked) => handleToggle('show_age', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              • Your posts and comments always display your <strong>display handle</strong> (random ID or username), never your email or other personal information.
            </p>
            <p>
              • These settings only control your profile visibility, not your content visibility.
            </p>
            <p>
              • Location information is always coarse (city/state/country level) and never precise coordinates.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}