-- Fix function security issue by setting search_path
create or replace function public.ensure_notif_settings(p_user uuid)
returns void 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  insert into public.notification_settings (user_id) values (p_user)
  on conflict (user_id) do nothing;
end$$;