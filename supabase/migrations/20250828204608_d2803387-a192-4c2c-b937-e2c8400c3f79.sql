-- Fix additional security definer functions that don't need elevated privileges

-- touch_updated_at only updates timestamps, doesn't need SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
begin
  new.updated_at = now(); 
  return new;
end$$;