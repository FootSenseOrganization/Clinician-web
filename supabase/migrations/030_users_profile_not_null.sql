-- ============================================================================
-- Migration 030: Enforce NOT NULL on all users_profile columns
-- No user field should ever be NULL — use empty string defaults instead
-- ============================================================================

-- Fill any remaining NULLs with defaults before adding constraints
UPDATE public.users_profile SET first_name = ''       WHERE first_name IS NULL;
UPDATE public.users_profile SET last_name = ''        WHERE last_name IS NULL;
UPDATE public.users_profile SET country_code = '+61'  WHERE country_code IS NULL;
UPDATE public.users_profile SET mobile_number = ''    WHERE mobile_number IS NULL;
UPDATE public.users_profile SET address = ''          WHERE address IS NULL;
UPDATE public.users_profile SET auth_provider = 'email' WHERE auth_provider IS NULL;

-- Add NOT NULL constraints
ALTER TABLE public.users_profile ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.users_profile ALTER COLUMN first_name SET DEFAULT '';

ALTER TABLE public.users_profile ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE public.users_profile ALTER COLUMN last_name SET DEFAULT '';

ALTER TABLE public.users_profile ALTER COLUMN country_code SET NOT NULL;
ALTER TABLE public.users_profile ALTER COLUMN country_code SET DEFAULT '+61';

ALTER TABLE public.users_profile ALTER COLUMN mobile_number SET NOT NULL;
ALTER TABLE public.users_profile ALTER COLUMN mobile_number SET DEFAULT '';

ALTER TABLE public.users_profile ALTER COLUMN address SET NOT NULL;
ALTER TABLE public.users_profile ALTER COLUMN address SET DEFAULT '';

ALTER TABLE public.users_profile ALTER COLUMN auth_provider SET NOT NULL;
ALTER TABLE public.users_profile ALTER COLUMN auth_provider SET DEFAULT 'email';

ALTER TABLE public.users_profile ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.users_profile ALTER COLUMN updated_at SET NOT NULL;
