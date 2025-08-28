-- Fix the last SECURITY DEFINER function: handle_new_user
-- This trigger creates a profile when a user signs up
-- Since the RLS policy allows users to access their own profile (auth.uid() = id),
-- this should work with SECURITY INVOKER

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
declare rid text := public.gen_urlsafe_id(10);
begin
  insert into public.profiles (id, random_id, display_handle, dob, city, state, country, country_iso)
  values (new.id, rid, rid, current_date, 'City','State','Country','US');
  return new;
end$$;