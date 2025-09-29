-- Fix the function signatures and recreate with proper types

-- Function to check if user is approved member of an HOA
CREATE OR REPLACE FUNCTION public.is_approved_member(user_id uuid, hoa_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.memberships
        WHERE memberships.user_id = is_approved_member.user_id
        AND memberships.hoa_id = is_approved_member.hoa_id
        AND status = 'APPROVED'
    );
END;
$$;

-- Drop existing problematic policies first
DROP POLICY IF EXISTS "HOA admins can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "HOA admins can view all memberships for their HOA" ON public.memberships;  
DROP POLICY IF EXISTS "HOA admins can view memberships for their HOA" ON public.memberships;

-- Create new safe policies for memberships
CREATE POLICY "Safe HOA admins can view memberships"
ON public.memberships
FOR SELECT
TO authenticated
USING (
    -- User can see their own memberships
    user_id = auth.uid()
    OR
    -- Platform admins can see all
    public.check_admin_status(auth.uid())
    OR
    -- Use existing is_hoa_admin function for HOA admin checks
    public.is_hoa_admin(auth.uid(), hoa_id)
);

CREATE POLICY "Safe HOA admins can update memberships"
ON public.memberships  
FOR UPDATE
TO authenticated
USING (
    -- Platform admins can update all
    public.check_admin_status(auth.uid())
    OR
    -- HOA admins can update memberships in their HOA
    public.is_hoa_admin(auth.uid(), hoa_id)
);