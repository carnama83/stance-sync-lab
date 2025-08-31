-- Create RPC functions for location management

-- Function to list all countries
CREATE OR REPLACE FUNCTION public.countries_list()
RETURNS TABLE (
  iso2 character(2),
  name text,
  emoji text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT iso2, name, emoji 
  FROM public.countries 
  ORDER BY name;
$function$;

-- Function to get regions by country
CREATE OR REPLACE FUNCTION public.regions_by_country(p_iso2 character(2))
RETURNS TABLE (
  id uuid,
  name text,
  code text,
  type text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, name, code, type 
  FROM public.regions 
  WHERE country_iso2 = p_iso2 
  ORDER BY name;
$function$;

-- Function to get counties by region
CREATE OR REPLACE FUNCTION public.counties_by_region(p_region uuid)
RETURNS TABLE (
  id uuid,
  name text,
  fips_code text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, name, fips_code 
  FROM public.counties 
  WHERE region_id = p_region 
  ORDER BY name;
$function$;

-- Function to get cities by region
CREATE OR REPLACE FUNCTION public.cities_by_region(p_region uuid)
RETURNS TABLE (
  id uuid,
  name text,
  population integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, name, population 
  FROM public.cities 
  WHERE region_id = p_region 
  ORDER BY name;
$function$;

-- Add location columns to stances if they don't exist
ALTER TABLE public.stances 
ADD COLUMN IF NOT EXISTS country_iso character(2),
ADD COLUMN IF NOT EXISTS region_id uuid,
ADD COLUMN IF NOT EXISTS city_id uuid,
ADD COLUMN IF NOT EXISTS county_id uuid;

-- Create index on stances location columns for performance
CREATE INDEX IF NOT EXISTS idx_stances_country_iso ON public.stances(country_iso);
CREATE INDEX IF NOT EXISTS idx_stances_region_id ON public.stances(region_id);
CREATE INDEX IF NOT EXISTS idx_stances_city_id ON public.stances(city_id);
CREATE INDEX IF NOT EXISTS idx_stances_county_id ON public.stances(county_id);

-- Update the stances_fill_location function to work with normalized location data
CREATE OR REPLACE FUNCTION public.stances_fill_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare p record;
begin
  -- get caller's profile
  select country_iso, region_id, city_id, county_id into p
  from public.profiles
  where id = auth.uid();

  -- snapshot values (use profile IDs available)
  new.country_iso := coalesce(new.country_iso, p.country_iso);
  new.region_id   := coalesce(new.region_id,   p.region_id);
  new.city_id     := coalesce(new.city_id,     p.city_id);
  new.county_id   := coalesce(new.county_id,   p.county_id);
  return new;
end$function$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_stances_fill_location ON public.stances;
CREATE TRIGGER trigger_stances_fill_location
  BEFORE INSERT ON public.stances
  FOR EACH ROW
  EXECUTE FUNCTION public.stances_fill_location();