-- Service-role RPC: get stances joined with coarse location (no PII beyond city/state/country_iso)
create or replace function public.rpc_stances_with_location()
returns table (
  question_id uuid,
  score smallint,
  city text,
  state text,
  country_iso text
)
language sql
security definer
set search_path = public
as $$
  select s.question_id, s.score, p.city, p.state, p.country_iso
  from public.stances s
  join public.profiles p on p.id = s.user_id;
$$;

revoke all on function public.rpc_stances_with_location() from public;
grant execute on function public.rpc_stances_with_location() to authenticated, anon;