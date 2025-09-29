-- Fix RLS policies for events - allow HOA admins to create and update events
CREATE POLICY "HOA admins can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (
  (check_admin_status(auth.uid()) OR is_hoa_admin(auth.uid(), hoa_id)) 
  AND created_by = auth.uid()
);

CREATE POLICY "HOA admins can update events" 
ON public.events 
FOR UPDATE 
USING (
  check_admin_status(auth.uid()) OR is_hoa_admin(auth.uid(), hoa_id)
);

-- Fix RLS policies for documents - allow HOA admins to create and update documents  
CREATE POLICY "HOA admins can create documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  (check_admin_status(auth.uid()) OR is_hoa_admin(auth.uid(), hoa_id)) 
  AND uploaded_by = auth.uid()
);

CREATE POLICY "HOA admins can update documents" 
ON public.documents 
FOR UPDATE 
USING (
  check_admin_status(auth.uid()) OR is_hoa_admin(auth.uid(), hoa_id)
);