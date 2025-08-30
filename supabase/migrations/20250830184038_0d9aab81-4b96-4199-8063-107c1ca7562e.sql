-- Create an initial admin user (password will be 'admin123')
-- Hash for 'admin123' with bcrypt rounds=10: $2a$10$XYZ... (generated)

INSERT INTO public.admin_users (email, password_hash) 
VALUES (
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
) 
ON CONFLICT (email) DO NOTHING;

-- Temporarily allow public inserts for initial setup (can be removed later)
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;

CREATE POLICY "Public can insert first admin user"
ON public.admin_users
FOR INSERT
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1)
  OR (auth.jwt() ->> 'role'::text) = 'admin'::text
);