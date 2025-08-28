-- Fix stances_append_history function - change to SECURITY INVOKER
-- This function appends history when stances are updated
-- Since users can only update their own stances, they should be able to create their own history

CREATE OR REPLACE FUNCTION public.stances_append_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
begin
  insert into public.stance_history (stance_id, prev_score, prev_rationale, prev_links)
  values (old.id, old.score, old.rationale, old.links);
  return new;
end$$;