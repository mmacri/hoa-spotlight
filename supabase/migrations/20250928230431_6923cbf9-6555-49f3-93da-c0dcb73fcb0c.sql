-- Remove problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- Remove duplicate policies
DROP POLICY IF EXISTS "Allow authenticated users to view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- The secure policies using check_admin_status function are already in place:
-- secure_profiles_select_admin, secure_profiles_update_admin, secure_profiles_delete_admin
-- secure_profiles_select_own, secure_profiles_update_own
-- secure_profiles_insert_admin

-- These are the correct policies that avoid recursion