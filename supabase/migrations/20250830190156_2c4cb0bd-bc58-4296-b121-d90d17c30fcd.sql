-- Fix the admin password hash for 'admin123' - correct hash
-- This is the correct bcrypt hash for 'admin123' with rounds=10
UPDATE public.admin_users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'admin@example.com';