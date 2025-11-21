-- Fix storage RLS policies for lesson files to allow enrolled students access

-- First, let's ensure authenticated users can view their enrolled course materials
-- Update RLS policies for lesson-videos bucket
DROP POLICY IF EXISTS "Authenticated users can view lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Instructors and admins can manage lesson videos" ON storage.objects;

CREATE POLICY "Students can view lesson videos for enrolled courses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-videos' 
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow if user is enrolled in the course that owns this lesson
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE l.video_url LIKE '%' || (storage.foldername(name))[1] || '%'
        AND e.student_id = auth.uid()
    )
    -- Or if user is the instructor
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.video_url LIKE '%' || (storage.foldername(name))[1] || '%'
        AND c.instructor_id = auth.uid()
    )
    -- Or if user is admin
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Instructors and admins can manage lesson videos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'lesson-videos' 
  AND (
    public.has_role(auth.uid(), 'instructor'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Update RLS policies for lesson-pdfs bucket
DROP POLICY IF EXISTS "Authenticated users can view lesson pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Instructors and admins can manage lesson pdfs" ON storage.objects;

CREATE POLICY "Students can view lesson PDFs for enrolled courses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-pdfs' 
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow if user is enrolled in the course that owns this lesson
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE l.pdf_url LIKE '%' || (storage.foldername(name))[1] || '%'
        AND e.student_id = auth.uid()
    )
    -- Or if user is the instructor
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.pdf_url LIKE '%' || (storage.foldername(name))[1] || '%'
        AND c.instructor_id = auth.uid()
    )
    -- Or if user is admin
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Instructors and admins can manage lesson PDFs"
ON storage.objects FOR ALL
USING (
  bucket_id = 'lesson-pdfs' 
  AND (
    public.has_role(auth.uid(), 'instructor'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);