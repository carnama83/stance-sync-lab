import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { validateUsername } from '@/lib/validations/username';
import { COUNTRY_OPTIONS, type LocationData } from '@/lib/utils/location';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  random_id: string;
  username: string | null;
  display_handle: string;
  avatar_url: string | null;
  dob: string;
  city: string;
  state: string;
  country: string;
  country_iso: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          navigate('/auth/signup');
          return;
        }

        setUser(currentUser);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          toast({
            title: "Error Loading Profile",
            description: "Failed to load your profile data.",
            variant: "destructive"
          });
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Error in loadUserAndProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndProfile();
  }, [navigate]);

  // Validate username on change
  useEffect(() => {
    if (profile?.username) {
      const validation = validateUsername(profile.username);
      setUsernameError(validation.isValid ? null : validation.error!);
    } else {
      setUsernameError(null);
    }
  }, [profile?.username]);

  const handleProfileChange = (field: keyof Profile, value: any) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleLocationChange = (field: keyof LocationData, value: string) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleDisplayToggle = () => {
    if (!profile) return;
    const newDisplayHandle = profile.display_handle === profile.random_id 
      ? (profile.username || profile.random_id)
      : profile.random_id;
    
    handleProfileChange('display_handle', newDisplayHandle);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !profile) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    if (profile.username && usernameError) {
      toast({
        title: "Invalid Username",
        description: usernameError,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = profile.avatar_url;

      // Handle avatar upload if new file selected
      if (avatarFile) {
        const uploadedUrl = await handleAvatarUpload(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const updateData: Partial<Profile> = {
        username: profile.username || null,
        display_handle: profile.display_handle,
        avatar_url: avatarUrl,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        country_iso: profile.country_iso,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      setAvatarFile(null);

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Profile not found.</p>
            <Button onClick={() => navigate('/')} className="w-full mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your identity and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identity Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Your Identities</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Random ID</Badge>
                    <span className="font-mono text-sm">{profile.random_id}</span>
                  </div>
                  {profile.username && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Username</Badge>
                      <span className="font-mono text-sm">{profile.username}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Public Display Handle</Label>
                <div className="mt-2 flex items-center space-x-4">
                  <Badge variant={profile.display_handle === profile.random_id ? "default" : "secondary"}>
                    Currently: {profile.display_handle}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDisplayToggle}
                    disabled={!profile.username}
                  >
                    Toggle Display
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Others see your display handle in public discussions
                </p>
              </div>
            </div>

            {/* Username Section */}
            <div className="space-y-2">
              <Label htmlFor="username">Username (Optional)</Label>
              <Input
                id="username"
                value={profile.username || ''}
                onChange={(e) => handleProfileChange('username', e.target.value || null)}
                placeholder="Enter custom username"
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters/numbers/underscore only
              </p>
            </div>

            {/* Avatar Section */}
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <div className="flex items-center space-x-4">
                {profile.avatar_url && (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Location (Public)</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="country_iso">Country</Label>
                  <Select 
                    value={profile.country_iso} 
                    onValueChange={(value) => {
                      const country = COUNTRY_OPTIONS.find(c => c.code === value);
                      if (country) {
                        handleLocationChange('country_iso', value);
                        handleLocationChange('country', country.name);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country Name</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => handleLocationChange('country', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Read-only DOB */}
            <div className="space-y-2">
              <Label>Date of Birth (Cannot be changed)</Label>
              <Input
                value={profile.dob}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving || !!usernameError}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
            Back to Home
          </Button>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}