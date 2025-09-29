-- Continue fixing remaining policies for posts and comments

-- Update posts policies to use safe functions
DROP POLICY IF EXISTS "HOA admins can moderate posts" ON public.posts;
DROP POLICY IF EXISTS "HOA members can create posts" ON public.posts;
DROP POLICY IF EXISTS "HOA members can view private posts for their HOA" ON public.posts;

CREATE POLICY "Safe HOA members can view private posts"
ON public.posts
FOR SELECT
TO authenticated
USING (
    -- Public posts visible to all
    visibility = 'PUBLIC'
    OR
    -- Platform admins can see all
    public.check_admin_status(auth.uid())
    OR
    -- HOA members can see private posts in their HOA
    (visibility = 'PRIVATE' AND public.is_approved_member(auth.uid(), hoa_id))
);

CREATE POLICY "Safe HOA members can create posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_approved_member(auth.uid(), hoa_id)
    AND author_user_id = auth.uid()
);

CREATE POLICY "Safe HOA admins can moderate posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (
    -- Users can update their own posts
    author_user_id = auth.uid()
    OR
    -- Platform admins can update all
    public.check_admin_status(auth.uid())
    OR
    -- HOA admins can moderate posts in their HOA
    public.is_hoa_admin(auth.uid(), hoa_id)
);

-- Update comments policies
DROP POLICY IF EXISTS "HOA admins can moderate all comments" ON public.comments;
DROP POLICY IF EXISTS "HOA members can create comments" ON public.comments;
DROP POLICY IF EXISTS "HOA members can view comments on private posts" ON public.comments;

CREATE POLICY "Safe HOA members can view comments"
ON public.comments
FOR SELECT
TO authenticated
USING (
    -- Approved comments on public posts
    (status = 'APPROVED' AND EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.id = comments.post_id 
        AND p.visibility = 'PUBLIC'
    ))
    OR
    -- Platform admins can see all
    public.check_admin_status(auth.uid())
    OR
    -- HOA members can see comments on posts in their HOA
    EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.id = comments.post_id 
        AND public.is_approved_member(auth.uid(), p.hoa_id)
    )
);

CREATE POLICY "Safe HOA members can create comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.id = comments.post_id 
        AND public.is_approved_member(auth.uid(), p.hoa_id)
    )
    AND author_user_id = auth.uid()
);

CREATE POLICY "Safe HOA admins can moderate comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (
    -- Platform admins can moderate all
    public.check_admin_status(auth.uid())
    OR
    -- HOA admins can moderate comments in their HOA
    EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.id = comments.post_id 
        AND public.is_hoa_admin(auth.uid(), p.hoa_id)
    )
);

-- Fix other tables that had similar issues
-- Update reviews policies
DROP POLICY IF EXISTS "HOA admins can moderate reviews for their HOA" ON public.reviews;
DROP POLICY IF EXISTS "HOA admins can moderate reviews for their community" ON public.reviews;

CREATE POLICY "Safe HOA admins can moderate reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
    -- Users can update their own pending reviews
    (user_id = auth.uid() AND status = 'PENDING')
    OR
    -- Platform admins can moderate all
    public.check_admin_status(auth.uid())
    OR
    -- HOA admins can moderate reviews for their community
    public.is_hoa_admin(auth.uid(), hoa_id)
);

-- Update role promotion requests policies
DROP POLICY IF EXISTS "HOA admins can update promotion requests for their community" ON public.role_promotion_requests;
DROP POLICY IF EXISTS "HOA admins can view promotion requests for their community" ON public.role_promotion_requests;

CREATE POLICY "Safe HOA admins can view promotion requests"
ON public.role_promotion_requests
FOR SELECT
TO authenticated
USING (
    -- Users can view their own requests
    requester_user_id = auth.uid()
    OR
    -- Platform admins can view all
    public.check_admin_status(auth.uid())
    OR
    -- HOA admins can view requests for their community
    public.is_hoa_admin(auth.uid(), hoa_id)
);

CREATE POLICY "Safe HOA admins can update promotion requests"
ON public.role_promotion_requests
FOR UPDATE
TO authenticated
USING (
    -- Platform admins can update all
    public.check_admin_status(auth.uid())
    OR
    -- HOA admins can update requests for their community
    public.is_hoa_admin(auth.uid(), hoa_id)
);