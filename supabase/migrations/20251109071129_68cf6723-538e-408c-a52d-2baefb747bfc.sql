-- Remove course approval column and update RLS policies
ALTER TABLE public.courses DROP COLUMN IF EXISTS is_approved;

-- Update the RLS policy to remove is_approved check
DROP POLICY IF EXISTS "Published courses viewable by everyone" ON public.courses;

CREATE POLICY "Published courses viewable by everyone" 
ON public.courses 
FOR SELECT 
USING (
  (is_published = true) 
  OR (instructor_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);