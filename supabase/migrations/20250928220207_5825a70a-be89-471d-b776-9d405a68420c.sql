-- Create HOAdoor database schema

-- Create enum types for better type safety
CREATE TYPE membership_role AS ENUM ('MEMBER', 'ADMIN', 'PRESIDENT');
CREATE TYPE membership_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE content_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE visibility_type AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE flag_target AS ENUM ('REVIEW', 'POST', 'COMMENT');
CREATE TYPE flag_status AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- HOA table - core entity
CREATE TABLE public.hoas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description_public TEXT,
    description_private TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    amenities TEXT[] DEFAULT '{}',
    unit_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Full text search vector
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(city, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(state, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(description_public, '')), 'C')
    ) STORED
);

-- Membership table - user relationships to HOAs
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'MEMBER',
    status membership_status NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, hoa_id)
);

-- Reviews table - ratings and reviews for HOAs
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    title TEXT,
    content TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    status content_status DEFAULT 'PENDING',
    moderated_by UUID REFERENCES auth.users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Prevent multiple reviews from same user for same HOA
    UNIQUE(user_id, hoa_id)
);

-- Admin responses to reviews
CREATE TABLE public.admin_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    responder_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Posts for private community
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE,
    author_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    visibility visibility_type DEFAULT 'PRIVATE',
    status content_status DEFAULT 'APPROVED',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Full text search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(content, '')), 'B')
    ) STORED
);

-- Comments on posts
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status content_status DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Documents for HOA communities
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    visibility visibility_type DEFAULT 'PRIVATE',
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Events for HOA communities
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_id UUID REFERENCES public.hoas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    visibility visibility_type DEFAULT 'PRIVATE',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content flagging system
CREATE TABLE public.flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type flag_target NOT NULL,
    target_id UUID NOT NULL,
    reporter_user_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status flag_status DEFAULT 'PENDING',
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit log for admin actions
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Rating aggregates (materialized view for performance)
CREATE MATERIALIZED VIEW public.rating_aggregates AS
SELECT 
    hoa_id,
    COUNT(*) as total_reviews,
    AVG(stars)::DECIMAL(3,2) as average_rating,
    COUNT(*) FILTER (WHERE stars = 1) as stars_1_count,
    COUNT(*) FILTER (WHERE stars = 2) as stars_2_count,
    COUNT(*) FILTER (WHERE stars = 3) as stars_3_count,
    COUNT(*) FILTER (WHERE stars = 4) as stars_4_count,
    COUNT(*) FILTER (WHERE stars = 5) as stars_5_count,
    MAX(created_at) as last_review_at
FROM public.reviews 
WHERE status = 'APPROVED'
GROUP BY hoa_id;

-- Create indexes for performance
CREATE INDEX idx_hoas_search_vector ON public.hoas USING gin(search_vector);
CREATE INDEX idx_hoas_slug ON public.hoas(slug);
CREATE INDEX idx_hoas_location ON public.hoas(city, state, zip_code);
CREATE INDEX idx_memberships_user_hoa ON public.memberships(user_id, hoa_id);
CREATE INDEX idx_memberships_hoa_status ON public.memberships(hoa_id, status);
CREATE INDEX idx_reviews_hoa_status ON public.reviews(hoa_id, status);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_posts_hoa ON public.posts(hoa_id);
CREATE INDEX idx_posts_search_vector ON public.posts USING gin(search_vector);
CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_documents_hoa ON public.documents(hoa_id);
CREATE INDEX idx_events_hoa_date ON public.events(hoa_id, starts_at);
CREATE INDEX idx_flags_target ON public.flags(target_type, target_id);
CREATE INDEX idx_audit_logs_actor_date ON public.audit_logs(actor_user_id, created_at);

-- Enable RLS on all tables
ALTER TABLE public.hoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- HOAs: Public read, admin write
CREATE POLICY "Anyone can view HOAs" ON public.hoas FOR SELECT USING (true);
CREATE POLICY "Platform admins can manage HOAs" ON public.hoas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Memberships: Users can view their own, HOA admins can manage for their HOA
CREATE POLICY "Users can view their own memberships" ON public.memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "HOA admins can view memberships for their HOA" ON public.memberships FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.memberships m2 
        WHERE m2.hoa_id = hoa_id 
        AND m2.user_id = auth.uid() 
        AND m2.role IN ('ADMIN', 'PRESIDENT') 
        AND m2.status = 'APPROVED'
    )
);
CREATE POLICY "Users can request membership" ON public.memberships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "HOA admins can manage memberships" ON public.memberships FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.memberships m2 
        WHERE m2.hoa_id = hoa_id 
        AND m2.user_id = auth.uid() 
        AND m2.role IN ('ADMIN', 'PRESIDENT') 
        AND m2.status = 'APPROVED'
    )
);

-- Reviews: Public read approved, users can create, HOA admins can moderate
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (status = 'APPROVED');
CREATE POLICY "Users can view their own reviews" ON public.reviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Users can update their own pending reviews" ON public.reviews FOR UPDATE USING (user_id = auth.uid() AND status = 'PENDING');
CREATE POLICY "HOA admins can moderate reviews for their HOA" ON public.reviews FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.hoa_id = hoa_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('ADMIN', 'PRESIDENT') 
        AND m.status = 'APPROVED'
    )
);

-- Admin responses: Public read, HOA admins can create
CREATE POLICY "Anyone can view admin responses" ON public.admin_responses FOR SELECT USING (true);
CREATE POLICY "HOA admins can create responses" ON public.admin_responses FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.reviews r
        JOIN public.memberships m ON m.hoa_id = r.hoa_id
        WHERE r.id = review_id
        AND m.user_id = auth.uid()
        AND m.role IN ('ADMIN', 'PRESIDENT')
        AND m.status = 'APPROVED'
    )
);

-- Posts: Members can view private posts for their HOA, create posts
CREATE POLICY "Anyone can view public posts" ON public.posts FOR SELECT USING (visibility = 'PUBLIC');
CREATE POLICY "HOA members can view private posts for their HOA" ON public.posts FOR SELECT USING (
    visibility = 'PRIVATE' AND EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.hoa_id = hoa_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'APPROVED'
    )
);
CREATE POLICY "HOA members can create posts" ON public.posts FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.hoa_id = hoa_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'APPROVED'
    ) AND author_user_id = auth.uid()
);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (author_user_id = auth.uid());
CREATE POLICY "HOA admins can moderate posts" ON public.posts FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.hoa_id = hoa_id 
        AND m.user_id = auth.uid() 
        AND m.role IN ('ADMIN', 'PRESIDENT') 
        AND m.status = 'APPROVED'
    )
);

-- Comments: Similar to posts
CREATE POLICY "Anyone can view approved comments on public posts" ON public.comments FOR SELECT USING (
    status = 'APPROVED' AND EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.visibility = 'PUBLIC'
    )
);
CREATE POLICY "HOA members can view comments on private posts" ON public.comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.memberships m ON m.hoa_id = p.hoa_id
        WHERE p.id = post_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'APPROVED'
    )
);
CREATE POLICY "HOA members can create comments" ON public.comments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.posts p
        JOIN public.memberships m ON m.hoa_id = p.hoa_id
        WHERE p.id = post_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'APPROVED'
    ) AND author_user_id = auth.uid()
);

-- Documents and Events: Similar patterns for HOA member access
CREATE POLICY "HOA members can view documents" ON public.documents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.hoa_id = hoa_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'APPROVED'
    )
);

CREATE POLICY "HOA members can view events" ON public.events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.hoa_id = hoa_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'APPROVED'
    )
);

-- Flags: Users can create, admins can manage
CREATE POLICY "Authenticated users can create flags" ON public.flags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Platform admins can view all flags" ON public.flags FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Audit logs: Platform admins only
CREATE POLICY "Platform admins can view audit logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Functions for common operations

-- Function to check if user is HOA admin
CREATE OR REPLACE FUNCTION public.is_hoa_admin(user_id UUID, hoa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.memberships
        WHERE memberships.user_id = is_hoa_admin.user_id
        AND memberships.hoa_id = is_hoa_admin.hoa_id
        AND role IN ('ADMIN', 'PRESIDENT')
        AND status = 'APPROVED'
    );
END;
$$;

-- Function to refresh rating aggregates
CREATE OR REPLACE FUNCTION public.refresh_rating_aggregates()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.rating_aggregates;
END;
$$;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply update timestamp triggers
CREATE TRIGGER update_hoas_updated_at BEFORE UPDATE ON public.hoas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_admin_responses_updated_at BEFORE UPDATE ON public.admin_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger to refresh rating aggregates when reviews change
CREATE OR REPLACE FUNCTION public.refresh_ratings_on_review_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh the materialized view when reviews are modified
    PERFORM public.refresh_rating_aggregates();
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER refresh_ratings_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH STATEMENT 
    EXECUTE FUNCTION public.refresh_ratings_on_review_change();