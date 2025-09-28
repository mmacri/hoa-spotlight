-- Create role promotion requests table
CREATE TABLE public.role_promotion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_user_id UUID NOT NULL,
  hoa_id UUID NOT NULL,
  current_membership_role membership_role NOT NULL DEFAULT 'MEMBER',
  requested_role membership_role NOT NULL,
  justification TEXT,
  status content_status NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_promotion_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for role promotion requests
CREATE POLICY "Users can view their own promotion requests" 
ON public.role_promotion_requests 
FOR SELECT 
USING (requester_user_id = auth.uid());

CREATE POLICY "Users can create their own promotion requests" 
ON public.role_promotion_requests 
FOR INSERT 
WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY "HOA admins can view promotion requests for their community" 
ON public.role_promotion_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.hoa_id = role_promotion_requests.hoa_id
  AND m.user_id = auth.uid()
  AND m.role IN ('ADMIN', 'PRESIDENT')
  AND m.status = 'APPROVED'
));

CREATE POLICY "HOA admins can update promotion requests for their community" 
ON public.role_promotion_requests 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.hoa_id = role_promotion_requests.hoa_id
  AND m.user_id = auth.uid()
  AND m.role IN ('ADMIN', 'PRESIDENT')
  AND m.status = 'APPROVED'
));

CREATE POLICY "Platform admins can manage all promotion requests" 
ON public.role_promotion_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
));

-- Add trigger for timestamp updates
CREATE TRIGGER update_role_promotion_requests_updated_at
BEFORE UPDATE ON public.role_promotion_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create function to handle role promotion approval
CREATE OR REPLACE FUNCTION public.approve_role_promotion(
  request_id UUID,
  admin_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_data RECORD;
BEGIN
  -- Get the request data
  SELECT * INTO request_data
  FROM public.role_promotion_requests
  WHERE id = request_id
  AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role promotion request not found or already processed';
  END IF;
  
  -- Update the user's role in memberships
  UPDATE public.memberships
  SET role = request_data.requested_role,
      updated_at = now()
  WHERE user_id = request_data.requester_user_id
  AND hoa_id = request_data.hoa_id;
  
  -- Update the request status
  UPDATE public.role_promotion_requests
  SET status = 'APPROVED',
      reviewed_by = admin_user_id,
      reviewed_at = now()
  WHERE id = request_id;
  
  -- Log the action
  PERFORM public.log_community_action(
    request_data.hoa_id,
    admin_user_id,
    'ROLE_PROMOTION_APPROVED',
    'ROLE_PROMOTION',
    request_id,
    jsonb_build_object(
      'user_id', request_data.requester_user_id,
      'from_role', request_data.current_membership_role,
      'to_role', request_data.requested_role
    )
  );
END;
$$;

-- Add trigger to log role promotion actions
CREATE OR REPLACE FUNCTION public.log_role_promotion_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log role promotion approval/rejection
  IF TG_OP = 'UPDATE' AND OLD.status = 'PENDING' AND NEW.status IN ('APPROVED', 'REJECTED') THEN
    PERFORM public.log_community_action(
      NEW.hoa_id,
      NEW.reviewed_by,
      CASE 
        WHEN NEW.status = 'APPROVED' THEN 'ROLE_PROMOTION_APPROVED'
        ELSE 'ROLE_PROMOTION_REJECTED'
      END,
      'ROLE_PROMOTION',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.requester_user_id,
        'from_role', NEW.current_membership_role,
        'to_role', NEW.requested_role,
        'reason', NEW.review_notes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_role_promotion_moderation
AFTER UPDATE ON public.role_promotion_requests
FOR EACH ROW
EXECUTE FUNCTION public.log_role_promotion_action();