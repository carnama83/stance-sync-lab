-- Fix the admin password hash for 'admin123'
-- Correct bcrypt hash for 'admin123' with rounds=10
UPDATE public.admin_users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye2p8HzkK57jbukFai/po7kWLOLokqBqO'
WHERE email = 'admin@example.com';