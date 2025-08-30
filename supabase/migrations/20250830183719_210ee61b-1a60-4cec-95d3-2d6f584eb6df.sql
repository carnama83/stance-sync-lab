-- Create admin_users table for secure admin authentication
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,  -- Hashed password stored for security
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for admin_users
alter table public.admin_users enable row level security;

-- Create policies for admin_users (only admins can manage other admins)
create policy "Admin users can select admin_users"
on public.admin_users
for select
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

create policy "Admin users can insert admin_users"
on public.admin_users
for insert
with check ((auth.jwt() ->> 'role'::text) = 'admin'::text);

create policy "Admin users can update admin_users"
on public.admin_users
for update
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Allow public select for login validation (controlled by application logic)
create policy "Public can select for login validation"
on public.admin_users
for select
using (true);

-- Create trigger to update updated_at timestamp
create trigger update_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.touch_updated_at();