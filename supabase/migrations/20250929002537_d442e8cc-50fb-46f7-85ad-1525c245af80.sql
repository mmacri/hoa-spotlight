-- Create resources table for community links and documents
CREATE TABLE IF NOT EXISTS public.community_resources (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hoa_id uuid NOT NULL REFERENCES public.hoas(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    url text,
    type text NOT NULL DEFAULT 'LINK' CHECK (type IN ('LINK', 'DOCUMENT', 'CONTACT', 'FORM')),
    category text DEFAULT 'GENERAL',
    is_public boolean NOT NULL DEFAULT false,
    display_order integer DEFAULT 0,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "HOA members can view community resources"
ON public.community_resources
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.hoa_id = community_resources.hoa_id
        AND m.user_id = auth.uid()
        AND m.status = 'APPROVED'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_admin = true
    )
);

CREATE POLICY "HOA admins can manage community resources"
ON public.community_resources
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.hoa_id = community_resources.hoa_id
        AND m.user_id = auth.uid()
        AND m.role IN ('ADMIN', 'PRESIDENT')
        AND m.status = 'APPROVED'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_admin = true
    )
);

-- Create updated_at trigger
CREATE TRIGGER update_community_resources_updated_at
    BEFORE UPDATE ON public.community_resources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();