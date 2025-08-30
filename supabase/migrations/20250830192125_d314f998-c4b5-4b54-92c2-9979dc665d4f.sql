-- Create the admin_create_admin function
CREATE OR REPLACE FUNCTION public.admin_create_admin(
  p_admin_email text, 
  p_admin_password text, 
  p_email text, 
  p_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare 
  v_hash text;
  v_new_id uuid;
begin
  -- Verify caller is an existing admin
  select password_hash into v_hash
  from public.admin_users
  where lower(email) = lower(p_admin_email);

  if v_hash is null or crypt(p_admin_password, v_hash) <> v_hash then
    raise exception 'not_authorized';
  end if;

  -- Create or update target admin (hash new password)
  insert into public.admin_users (email, password_hash)
  values (lower(p_email), crypt(p_password, gen_salt('bf', 10)))
  on conflict (email) do update
    set password_hash = excluded.password_hash,
        updated_at = now()
  returning id into v_new_id;

  return v_new_id;
end$function$;