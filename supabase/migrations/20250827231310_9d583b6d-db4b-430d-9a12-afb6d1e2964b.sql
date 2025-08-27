-- Fix security issues from previous migration

-- Fix function search path for gen_urlsafe_id
create or replace function public.gen_urlsafe_id(n int default 10)
returns text 
language plpgsql 
security definer
set search_path = public
as $$
declare raw text := encode(gen_random_bytes(8),'base64');
begin
  raw := replace(replace(raw,'+','-'),'/','_');
  return left(replace(raw,'=',''), n);
end$$;

-- Fix function search path for handle_new_user
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
declare rid text := public.gen_urlsafe_id(10);
begin
  insert into public.profiles (id, random_id, display_handle, dob, city, state, country, country_iso)
  values (new.id, rid, rid, current_date, 'City','State','Country','US');
  return new;
end$$;

-- Fix the public_profiles view security definer issue
-- Drop the existing view and recreate without security definer properties
drop view if exists public.public_profiles;

-- Create a regular view (not security definer) for public profile data
create view public.public_profiles as
select
  id, random_id, display_handle, avatar_url, city, state, country, country_iso
from public.profiles;

-- Grant explicit permissions
grant select on public.public_profiles to anon, authenticated;