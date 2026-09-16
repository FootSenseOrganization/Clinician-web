-- ============================================================================
-- Migration 015: Users Profile Table with RBAC (Friend's migration — ALREADY APPLIED)
-- Central auth table referencing auth.users with role-based access control.
-- Roles: 'user' (patient), 'clinician', 'admin'
-- ============================================================================

-- 1. Create users_profile table with role constraint
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'clinician', 'admin')),
  country_code TEXT NOT NULL DEFAULT '+61',
  mobile_number TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  auth_provider TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON public.users_profile(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_provider ON public.users_profile(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON public.users_profile(role);

-- 3. Helper Function to Get Current User Role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users_profile WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Enable RLS
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "View profile policy (User, Clinician, Admin)"
  ON public.users_profile FOR SELECT
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) IN ('clinician', 'admin')
  );

CREATE POLICY "Update profile policy (User, Admin)"
  ON public.users_profile FOR UPDATE
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Insert profile policy (User, Admin)"
  ON public.users_profile FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Delete profile policy (Admin only)"
  ON public.users_profile FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 6. Auto-create users_profile on Supabase Auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, first_name, last_name, role, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
