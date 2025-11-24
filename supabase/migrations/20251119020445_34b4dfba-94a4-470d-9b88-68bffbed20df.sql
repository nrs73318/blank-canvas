-- Add reviewed_by and reviewed_at columns to courses table for admin tracking
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Create course_review_history table for tracking all review actions
CREATE TABLE IF NOT EXISTS public.course_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('approved', 'rejected')),
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on course_review_history
ALTER TABLE public.course_review_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view review history
CREATE POLICY "Admins can view review history"
ON public.course_review_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert review history
CREATE POLICY "Admins can insert review history"
ON public.course_review_history
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add category column to complaints for categorization (complaints, inquiries, etc.)
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS category text DEFAULT 'complaint' CHECK (category IN ('complaint', 'inquiry', 'technical', 'feedback', 'other'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_course_review_history_course_id ON public.course_review_history(course_id);