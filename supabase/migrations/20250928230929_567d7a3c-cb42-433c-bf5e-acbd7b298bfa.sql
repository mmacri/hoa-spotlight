-- Fix the RLS policy for users to check their own reviews
-- The current policy "Users can view their own reviews" should work, but let's make sure it's correct

-- First, let's check what the issue is with the existing policies
-- The 406 error suggests the query is trying to return a single object but getting 0 rows

-- Add a policy specifically for checking if user has existing review (uses maybeSingle pattern)
CREATE POLICY "Users can check their own reviews exists" ON public.reviews
FOR SELECT 
USING (user_id = auth.uid());