-- Create HOAdoor database schema with conditional checks

-- Create enum types only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        CREATE TYPE membership_role AS ENUM ('MEMBER', 'ADMIN', 'PRESIDENT');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        CREATE TYPE membership_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE content_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_type') THEN
        CREATE TYPE visibility_type AS ENUM ('PRIVATE', 'PUBLIC');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_target') THEN
        CREATE TYPE flag_target AS ENUM ('REVIEW', 'POST', 'COMMENT');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_status') THEN
        CREATE TYPE flag_status AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
    END IF;
END $$;

-- Create tables only if they don't exist

-- HOA table - core entity
CREATE TABLE IF NOT EXISTS public.hoas (
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
CREATE TABLE IF NOT EXISTS public.memberships (
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
CREATE TABLE IF NOT EXISTS public.reviews (
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
CREATE TABLE IF NOT EXISTS public.admin_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    responder_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Posts for private community
CREATE TABLE IF NOT EXISTS public.posts (
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
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status content_status DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Documents for HOA communities
CREATE TABLE IF NOT EXISTS public.documents (
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
CREATE TABLE IF NOT EXISTS public.events (
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
CREATE TABLE IF NOT EXISTS public.flags (
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
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create or replace rating aggregates materialized view
DROP MATERIALIZED VIEW IF EXISTS public.rating_aggregates;
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

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_hoas_search_vector ON public.hoas USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_hoas_slug ON public.hoas(slug);
CREATE INDEX IF NOT EXISTS idx_hoas_location ON public.hoas(city, state, zip_code);
CREATE INDEX IF NOT EXISTS idx_memberships_user_hoa ON public.memberships(user_id, hoa_id);
CREATE INDEX IF NOT EXISTS idx_memberships_hoa_status ON public.memberships(hoa_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_hoa_status ON public.reviews(hoa_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_hoa ON public.posts(hoa_id);
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON public.posts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_documents_hoa ON public.documents(hoa_id);
CREATE INDEX IF NOT EXISTS idx_events_hoa_date ON public.events(hoa_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_flags_target ON public.flags(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_date ON public.audit_logs(actor_user_id, created_at);

-- Enable RLS on all new tables
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