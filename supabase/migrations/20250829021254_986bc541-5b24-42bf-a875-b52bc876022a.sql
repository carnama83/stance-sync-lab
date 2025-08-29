-- Fix the search path issue for the rate limit function
create or replace function public.enforce_comment_rate_limit()
returns trigger language plpgsql 
security definer set search_path = public
as $$
begin
  if (
    select count(*) from public.comments
    where user_id = new.user_id and created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'Rate limit: too many comments, please wait.';
  end if;
  return new;
end$$;