-- Fix search_path for gen_urlsafe_id to include extensions where pgcrypto lives
CREATE OR REPLACE FUNCTION public.gen_urlsafe_id(n integer DEFAULT 10)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public, extensions'
AS $function$
DECLARE
  raw text := encode(gen_random_bytes(8),'base64');
BEGIN
  raw := replace(replace(raw,'+','-'),'/','_');
  RETURN left(replace(raw,'=',''), n);
END
$function$;