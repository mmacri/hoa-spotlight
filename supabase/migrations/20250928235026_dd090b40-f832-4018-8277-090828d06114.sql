-- Add deletion policies for platform administrators across all tables

-- HOAs table - allow platform admins to delete
CREATE POLICY "Platform admins can delete HOAs" 
ON public.hoas 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Reviews table - allow platform admins to delete
CREATE POLICY "Platform admins can delete reviews" 
ON public.reviews 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Posts table - allow platform admins to delete
CREATE POLICY "Platform admins can delete posts" 
ON public.posts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Comments table - allow platform admins to delete
CREATE POLICY "Platform admins can delete comments" 
ON public.comments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Memberships table - allow platform admins to delete
CREATE POLICY "Platform admins can delete memberships" 
ON public.memberships 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- HOA creation requests table - allow platform admins to delete
CREATE POLICY "Platform admins can delete HOA creation requests" 
ON public.hoa_creation_requests 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Role promotion requests table - allow platform admins to delete
CREATE POLICY "Platform admins can delete role promotion requests" 
ON public.role_promotion_requests 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Events table - allow platform admins to delete
CREATE POLICY "Platform admins can delete events" 
ON public.events 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Documents table - allow platform admins to delete
CREATE POLICY "Platform admins can delete documents" 
ON public.documents 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Admin responses table - allow platform admins to delete
CREATE POLICY "Platform admins can delete admin responses" 
ON public.admin_responses 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Create comprehensive deletion audit logging function
CREATE OR REPLACE FUNCTION public.log_deletion_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all deletions performed by admins
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    'ADMIN_DELETE_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    OLD.id,
    jsonb_build_object(
      'deleted_record', to_jsonb(OLD),
      'deletion_timestamp', now(),
      'table_name', TG_TABLE_NAME
    )
  );
  
  RETURN OLD;
END;
$$;

-- Add deletion audit triggers to all major tables
CREATE TRIGGER audit_hoas_deletion
  AFTER DELETE ON public.hoas
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deletion_action();

CREATE TRIGGER audit_reviews_deletion
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deletion_action();

CREATE TRIGGER audit_posts_deletion
  AFTER DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deletion_action();

CREATE TRIGGER audit_comments_deletion
  AFTER DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deletion_action();

CREATE TRIGGER audit_memberships_deletion
  AFTER DELETE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deletion_action();

CREATE TRIGGER audit_hoa_creation_requests_deletion
  AFTER DELETE ON public.hoa_creation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deletion_action();

CREATE TRIGGER audit_role_promotion_requests_deletion
  AFTER DELETE ON public.role_promotion_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deletion_action();

-- Create function for safe cascade deletion of HOAs
CREATE OR REPLACE FUNCTION public.delete_hoa_cascade(
  hoa_id_param UUID,
  admin_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hoa_record RECORD;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = admin_user_id
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to delete HOA';
  END IF;
  
  -- Get HOA details for logging
  SELECT * INTO hoa_record FROM public.hoas WHERE id = hoa_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HOA not found';
  END IF;
  
  -- Delete related records in correct order
  DELETE FROM public.admin_responses WHERE review_id IN (
    SELECT id FROM public.reviews WHERE hoa_id = hoa_id_param
  );
  
  DELETE FROM public.reviews WHERE hoa_id = hoa_id_param;
  DELETE FROM public.comments WHERE post_id IN (
    SELECT id FROM public.posts WHERE hoa_id = hoa_id_param
  );
  DELETE FROM public.posts WHERE hoa_id = hoa_id_param;
  DELETE FROM public.events WHERE hoa_id = hoa_id_param;
  DELETE FROM public.documents WHERE hoa_id = hoa_id_param;
  DELETE FROM public.memberships WHERE hoa_id = hoa_id_param;
  DELETE FROM public.community_audit_logs WHERE hoa_id = hoa_id_param;
  DELETE FROM public.role_promotion_requests WHERE hoa_id = hoa_id_param;
  DELETE FROM public.bulk_operations WHERE hoa_id = hoa_id_param;
  
  -- Finally delete the HOA itself
  DELETE FROM public.hoas WHERE id = hoa_id_param;
  
  -- Log the cascade deletion
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    admin_user_id,
    'ADMIN_CASCADE_DELETE_HOA',
    'HOA',
    hoa_id_param,
    jsonb_build_object(
      'hoa_name', hoa_record.name,
      'deletion_type', 'cascade',
      'deleted_timestamp', now()
    )
  );
END;
$$;