-- Fix missing gen_random_bytes function by enabling pgcrypto extension
-- This is needed for the gen_urlsafe_id function used in user profiles

CREATE EXTENSION IF NOT EXISTS pgcrypto;