-- Fix security definer issue by changing gen_urlsafe_id to SECURITY INVOKER
-- This function only generates random strings and doesn't need elevated privileges

CREATE OR REPLACE FUNCTION public.gen_urlsafe_id(n integer DEFAULT 10)
RETURNS text 
LANGUAGE plpgsql 
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
declare raw text := encode(gen_random_bytes(8),'base64');
begin
  raw := replace(replace(raw,'+','-'),'/','_');
  return left(replace(raw,'=',''), n);
end$$;