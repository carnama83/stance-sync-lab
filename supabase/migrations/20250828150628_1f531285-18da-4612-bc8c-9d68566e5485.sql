-- Fix function security: add search_path and security definer settings
create or replace function public.touch_updated_at()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  new.updated_at = now(); 
  return new;
end$$;

create or replace function public.stances_append_history()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  insert into public.stance_history (stance_id, prev_score, prev_rationale, prev_links)
  values (old.id, old.score, old.rationale, old.links);
  return new;
end$$;

-- Enable RLS on stance_history table  
alter table public.stance_history enable row level security;

-- Add policies for stance_history (users can only see history of their own stances)
create policy stance_history_owner_read on public.stance_history
  for select using (
    exists (
      select 1 from public.stances s 
      where s.id = stance_history.stance_id 
      and s.user_id = auth.uid()
    )
  );