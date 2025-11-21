-- Add missing columns to lessons table
ALTER TABLE public.lessons ADD COLUMN lesson_type TEXT DEFAULT 'video';

-- Add objectives column to courses
ALTER TABLE public.courses ADD COLUMN objectives TEXT[];

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own payments"
  ON public.payments FOR SELECT
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own progress"
  ON public.lesson_progress FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can manage their own progress"
  ON public.lesson_progress FOR ALL
  USING (student_id = auth.uid());

-- Rename wishlist table to wishlists (for consistency)
ALTER TABLE public.wishlist RENAME TO wishlists;