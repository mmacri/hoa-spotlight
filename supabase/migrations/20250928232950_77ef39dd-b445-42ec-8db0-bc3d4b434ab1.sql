-- Create HOA creation requests table
CREATE TABLE IF NOT EXISTS public.hoa_creation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_user_id UUID NOT NULL,
  status content_status NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description_public TEXT,
  description_private TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  unit_count INTEGER,
  amenities TEXT[] DEFAULT '{}'
);

-- Enable RLS on HOA creation requests
ALTER TABLE public.hoa_creation_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create HOA requests
CREATE POLICY "Authenticated users can create HOA requests"
ON public.hoa_creation_requests
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND requester_user_id = auth.uid());

-- Allow users to view their own requests
CREATE POLICY "Users can view their own HOA requests"
ON public.hoa_creation_requests
FOR SELECT
USING (requester_user_id = auth.uid());

-- Allow platform admins to manage all HOA requests
CREATE POLICY "Platform admins can manage HOA requests"
ON public.hoa_creation_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Create bulk operations audit table
CREATE TABLE IF NOT EXISTS public.bulk_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hoa_id UUID,
  operator_user_id UUID NOT NULL,
  operation_type TEXT NOT NULL, -- 'BULK_HOA_IMPORT', 'BULK_MEMBER_IMPORT', 'BULK_COMMENT_APPROVAL'
  file_name TEXT,
  total_records INTEGER,
  successful_records INTEGER,
  failed_records INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bulk operations
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;

-- Allow platform admins to view all bulk operations
CREATE POLICY "Platform admins can view all bulk operations"
ON public.bulk_operations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow HOA admins to view bulk operations for their HOA
CREATE POLICY "HOA admins can view bulk operations for their HOA"
ON public.bulk_operations
FOR SELECT
USING (
  hoa_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.hoa_id = bulk_operations.hoa_id
    AND m.user_id = auth.uid()
    AND m.role IN ('ADMIN', 'PRESIDENT')
    AND m.status = 'APPROVED'
  )
);

-- Allow system to insert bulk operations
CREATE POLICY "System can insert bulk operations"
ON public.bulk_operations
FOR INSERT
WITH CHECK (true);

-- Update comment creation to set status as PENDING by default
ALTER TABLE public.comments ALTER COLUMN status SET DEFAULT 'PENDING';

-- Add new comment approval policy for HOA admins
CREATE POLICY "HOA admins can moderate all comments"
ON public.comments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM posts p
    JOIN memberships m ON m.hoa_id = p.hoa_id
    WHERE p.id = comments.post_id
    AND m.user_id = auth.uid()
    AND m.role IN ('ADMIN', 'PRESIDENT')
    AND m.status = 'APPROVED'
  )
);

-- Create function to generate HOA slug
CREATE OR REPLACE FUNCTION public.generate_hoa_slug(hoa_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special characters
  base_slug := lower(
    regexp_replace(
      regexp_replace(hoa_name, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  final_slug := base_slug;
  
  -- Check for existing slugs and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.hoas WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create function to create HOA from request
CREATE OR REPLACE FUNCTION public.create_hoa_from_request(request_id UUID, admin_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_data RECORD;
  new_hoa_id UUID;
  hoa_slug TEXT;
BEGIN
  -- Get the request data
  SELECT * INTO request_data
  FROM public.hoa_creation_requests
  WHERE id = request_id
  AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HOA creation request not found or already processed';
  END IF;
  
  -- Generate unique slug
  hoa_slug := public.generate_hoa_slug(request_data.name);
  
  -- Create the HOA
  INSERT INTO public.hoas (
    name, slug, description_public, description_private,
    city, state, zip_code, unit_count, amenities
  ) VALUES (
    request_data.name, hoa_slug, request_data.description_public, request_data.description_private,
    request_data.city, request_data.state, request_data.zip_code, request_data.unit_count, request_data.amenities
  ) RETURNING id INTO new_hoa_id;
  
  -- Create membership for the requester as PRESIDENT
  INSERT INTO public.memberships (user_id, hoa_id, role, status, approved_by, approved_at)
  VALUES (request_data.requester_user_id, new_hoa_id, 'PRESIDENT', 'APPROVED', admin_user_id, now());
  
  -- Update the request status
  UPDATE public.hoa_creation_requests
  SET status = 'APPROVED', reviewed_by = admin_user_id, reviewed_at = now()
  WHERE id = request_id;
  
  -- Log the action
  PERFORM public.log_community_action(
    new_hoa_id,
    admin_user_id,
    'HOA_CREATED_FROM_REQUEST',
    'HOA',
    new_hoa_id,
    jsonb_build_object('request_id', request_id, 'requester_user_id', request_data.requester_user_id)
  );
  
  RETURN new_hoa_id;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_hoa_creation_requests_updated_at
  BEFORE UPDATE ON public.hoa_creation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();