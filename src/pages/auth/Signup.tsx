import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { validateUsername } from '@/lib/validations/username';
import { mockGeolocateIP, validateLocationData, COUNTRY_OPTIONS, type LocationData } from '@/lib/utils/location';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  username?: string;
  useUsername: boolean;
  location: LocationData;
}

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    username: '',
    useUsername: false,
    location: { city: '', state: '', country: '', country_iso: 'US' }
  });
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Mock IP geolocation on component mount
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const location = await mockGeolocateIP();
        setFormData(prev => ({ ...prev, location }));
      } catch (error) {
        console.error('Failed to get location:', error);
        toast({
          title: "Location Detection Failed",
          description: "Please enter your location manually.",
          variant: "destructive"
        });
      } finally {
        setLocationLoading(false);
      }
    };

    loadLocation();
  }, []);

  // Validate username on change
  useEffect(() => {
    if (formData.useUsername && formData.username) {
      const validation = validateUsername(formData.username);
      setUsernameError(validation.isValid ? null : validation.error!);
    } else {
      setUsernameError(null);
    }
  }, [formData.username, formData.useUsername]);

  const handleInputChange = (field: keyof SignupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: keyof LocationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.dob) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return false;
    }

    // Validate age (must be 13+)
    const birthDate = new Date(formData.dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      toast({
        title: "Age Requirement",
        description: "You must be at least 13 years old to sign up.",
        variant: "destructive"
      });
      return false;
    }

    if (!validateLocationData(formData.location)) {
      toast({
        title: "Invalid Location",
        description: "Please provide valid location information.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.useUsername && usernameError) {
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            dob: formData.dob,
            city: formData.location.city,
            state: formData.location.state,
            country: formData.location.country,
            country_iso: formData.location.country_iso,
            username: formData.useUsername ? formData.username : null,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with additional data if user was created
        const profileUpdate: any = {
          dob: formData.dob,
          city: formData.location.city,
          state: formData.location.state,
          country: formData.location.country,
          country_iso: formData.location.country_iso,
        };

        if (formData.useUsername && formData.username) {
          profileUpdate.username = formData.username;
          profileUpdate.display_handle = formData.username;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // Don't block signup for profile update errors
        }

        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });

        navigate('/');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An error occurred during signup.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Join Website V2 for privacy-focused news discussions
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth * (13+ required)</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                required
              />
            </div>

            {/* Username Toggle */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.useUsername}
                  onChange={(e) => handleInputChange('useUsername', e.target.checked)}
                />
                <span>Set custom username (optional)</span>
              </Label>
              {formData.useUsername && (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                  />
                  {usernameError && (
                    <p className="text-sm text-destructive">{usernameError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4">
              <Label>Location (Privacy: City/State/Country only) *</Label>
              
              {locationLoading ? (
                <p className="text-sm text-muted-foreground">Detecting location...</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={formData.location.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="State/Province"
                      value={formData.location.state}
                      onChange={(e) => handleLocationChange('state', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select 
                      value={formData.location.country_iso} 
                      onValueChange={(value) => {
                        const country = COUNTRY_OPTIONS.find(c => c.code === value);
                        if (country) {
                          handleLocationChange('country_iso', value);
                          handleLocationChange('country', country.name);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.location.country}
                      onChange={(e) => handleLocationChange('country', e.target.value)}
                      placeholder="Country name"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || locationLoading || (formData.useUsername && !!usernameError)}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Home
            </Button>
            <div className="mt-4 text-sm">
              <Link to="/auth/signin" className="text-sky-900 underline">
                Already have an account? Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}