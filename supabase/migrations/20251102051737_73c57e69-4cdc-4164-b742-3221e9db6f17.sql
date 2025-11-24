-- Create lesson_comments table for lesson discussions
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enrolled students can view lesson comments"
ON public.lesson_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.lessons
    JOIN public.enrollments ON enrollments.course_id = lessons.course_id
    WHERE lessons.id = lesson_comments.lesson_id
      AND enrollments.student_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Enrolled students can create lesson comments"
ON public.lesson_comments
FOR INSERT
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.lessons
    JOIN public.enrollments ON enrollments.course_id = lessons.course_id
    WHERE lessons.id = lesson_comments.lesson_id
      AND enrollments.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update their own comments"
ON public.lesson_comments
FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own comments"
ON public.lesson_comments
FOR DELETE
USING (student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for performance
CREATE INDEX idx_lesson_comments_lesson_id ON public.lesson_comments(lesson_id);
CREATE INDEX idx_lesson_comments_parent_id ON public.lesson_comments(parent_id);