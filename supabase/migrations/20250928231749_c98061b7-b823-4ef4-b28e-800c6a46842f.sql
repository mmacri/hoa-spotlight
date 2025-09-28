-- Create community audit logging system
CREATE TABLE IF NOT EXISTS public.community_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hoa_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on community audit logs
ALTER TABLE public.community_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for community audit logs
CREATE POLICY "HOA admins and presidents can view community audit logs"
ON public.community_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.hoa_id = community_audit_logs.hoa_id
    AND m.user_id = auth.uid()
    AND m.role IN ('ADMIN', 'PRESIDENT')
    AND m.status = 'APPROVED'
  )
);

-- Create policy for inserting audit logs (system-level)
CREATE POLICY "System can insert community audit logs"
ON public.community_audit_logs
FOR INSERT
WITH CHECK (true);

-- Create function to log community actions
CREATE OR REPLACE FUNCTION public.log_community_action(
  p_hoa_id UUID,
  p_actor_user_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.community_audit_logs (hoa_id, actor_user_id, action, target_type, target_id, details)
  VALUES (p_hoa_id, p_actor_user_id, p_action, p_target_type, p_target_id, p_details);
END;
$$;

-- Update membership policies to allow HOA admins to manage their community
CREATE POLICY "HOA admins can view all memberships for their HOA"
ON public.memberships
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m2
    WHERE m2.hoa_id = memberships.hoa_id
    AND m2.user_id = auth.uid()
    AND m2.role IN ('ADMIN', 'PRESIDENT')
    AND m2.status = 'APPROVED'
  )
);

-- Update reviews policies to allow HOA admins to moderate their community reviews
CREATE POLICY "HOA admins can moderate reviews for their community"
ON public.reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.hoa_id = reviews.hoa_id
    AND m.user_id = auth.uid()
    AND m.role IN ('ADMIN', 'PRESIDENT')
    AND m.status = 'APPROVED'
  )
);

-- Create trigger to automatically log membership actions
CREATE OR REPLACE FUNCTION public.log_membership_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log membership approval/rejection
  IF TG_OP = 'UPDATE' AND OLD.status = 'PENDING' AND NEW.status IN ('APPROVED', 'REJECTED') THEN
    PERFORM public.log_community_action(
      NEW.hoa_id,
      NEW.approved_by,
      CASE 
        WHEN NEW.status = 'APPROVED' THEN 'MEMBERSHIP_APPROVED'
        ELSE 'MEMBERSHIP_REJECTED'
      END,
      'MEMBERSHIP',
      NEW.id,
      jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for membership actions
DROP TRIGGER IF EXISTS membership_audit_trigger ON public.memberships;
CREATE TRIGGER membership_audit_trigger
  AFTER UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_membership_action();

-- Create trigger to automatically log review moderation actions
CREATE OR REPLACE FUNCTION public.log_review_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log review approval/rejection
  IF TG_OP = 'UPDATE' AND OLD.status = 'PENDING' AND NEW.status IN ('APPROVED', 'REJECTED') THEN
    PERFORM public.log_community_action(
      NEW.hoa_id,
      NEW.moderated_by,
      CASE 
        WHEN NEW.status = 'APPROVED' THEN 'REVIEW_APPROVED'
        ELSE 'REVIEW_REJECTED'
      END,
      'REVIEW',
      NEW.id,
      jsonb_build_object(
        'stars', NEW.stars, 
        'reason', NEW.moderation_reason,
        'user_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for review moderation
DROP TRIGGER IF EXISTS review_moderation_audit_trigger ON public.reviews;
CREATE TRIGGER review_moderation_audit_trigger
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.log_review_moderation();