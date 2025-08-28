-- Fix security definer view issue by recreating public_profiles without location data
-- and explicitly setting it to SECURITY INVOKER for better security

-- Drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate view with only non-sensitive data and SECURITY INVOKER
CREATE VIEW public.public_profiles 
WITH (security_invoker=true)
AS SELECT
    id, 
    random_id, 
    display_handle, 
    avatar_url
FROM public.profiles;

-- Grant permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;