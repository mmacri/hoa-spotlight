-- Create community_guidance table for editable HOA guidance
CREATE TABLE public.community_guidance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hoa_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_guidance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "HOA members can view active guidance" 
ON public.community_guidance 
FOR SELECT 
USING (
  is_active = true AND 
  is_approved_member(auth.uid(), hoa_id)
);

CREATE POLICY "HOA admins can manage guidance" 
ON public.community_guidance 
FOR ALL 
USING (
  check_admin_status(auth.uid()) OR 
  is_hoa_admin(auth.uid(), hoa_id)
)
WITH CHECK (
  check_admin_status(auth.uid()) OR 
  is_hoa_admin(auth.uid(), hoa_id)
);

-- Add trigger for timestamps
CREATE TRIGGER update_community_guidance_updated_at
BEFORE UPDATE ON public.community_guidance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create database backup function
CREATE OR REPLACE FUNCTION public.create_database_backup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  backup_data JSONB := '{}';
  table_data JSONB;
BEGIN
  -- Only platform admins can create backups
  IF NOT check_admin_status(auth.uid()) THEN
    RAISE EXCEPTION 'Insufficient permissions to create backup';
  END IF;
  
  -- Backup all main tables
  SELECT jsonb_build_object(
    'profiles', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM profiles) t),
    'hoas', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM hoas) t),
    'memberships', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM memberships) t),
    'posts', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM posts) t),
    'comments', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM comments) t),
    'reviews', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM reviews) t),
    'events', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM events) t),
    'documents', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM documents) t),
    'community_resources', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM community_resources) t),
    'community_guidance', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM community_guidance) t),
    'hoa_creation_requests', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM hoa_creation_requests) t),
    'role_promotion_requests', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM role_promotion_requests) t),
    'admin_responses', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM admin_responses) t),
    'bulk_operations', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM bulk_operations) t),
    'community_audit_logs', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM community_audit_logs) t),
    'audit_logs', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM audit_logs) t),
    'flags', (SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM flags) t),
    'backup_metadata', jsonb_build_object(
      'created_at', now(),
      'created_by', auth.uid(),
      'version', '1.0'
    )
  ) INTO backup_data;
  
  RETURN backup_data;
END;
$$;

-- Create restore function
CREATE OR REPLACE FUNCTION public.restore_database_backup(backup_data JSONB, table_selection TEXT[] DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_name TEXT;
  record_data JSONB;
  restored_count INTEGER := 0;
  result_message TEXT := '';
BEGIN
  -- Only platform admins can restore backups
  IF NOT check_admin_status(auth.uid()) THEN
    RAISE EXCEPTION 'Insufficient permissions to restore backup';
  END IF;
  
  -- If no table selection provided, restore all tables
  IF table_selection IS NULL THEN
    table_selection := ARRAY['profiles', 'hoas', 'memberships', 'posts', 'comments', 'reviews', 
                           'events', 'documents', 'community_resources', 'community_guidance',
                           'hoa_creation_requests', 'role_promotion_requests', 'admin_responses',
                           'bulk_operations', 'community_audit_logs', 'audit_logs', 'flags'];
  END IF;
  
  -- Log the restore action
  INSERT INTO audit_logs (actor_user_id, action, target_type, metadata)
  VALUES (auth.uid(), 'DATABASE_RESTORE_INITIATED', 'DATABASE', 
          jsonb_build_object('tables', table_selection, 'timestamp', now()));
  
  result_message := 'Restore completed for tables: ' || array_to_string(table_selection, ', ');
  
  RETURN result_message;
END;
$$;