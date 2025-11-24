-- Fix security warning: Add search_path to update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STORAGE BUCKETS CREATION
-- ============================================================================

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create course-thumbnails bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-thumbnails',
  'course-thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create course-content bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-content',
  'course-content',
  false,
  524288000, -- 500MB
  ARRAY['video/mp4', 'video/webm', 'application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create lesson-videos bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos',
  'lesson-videos',
  false,
  524288000, -- 500MB
  ARRAY['video/mp4', 'video/webm']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create lesson-pdfs bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-pdfs',
  'lesson-pdfs',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create certificates bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Avatars bucket policies (public bucket)
CREATE POLICY "Avatar images publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Course thumbnails policies (public bucket)
CREATE POLICY "Course thumbnails publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Instructors can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'instructor'
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Instructors can update course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'instructor'
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Instructors can delete course thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-thumbnails'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'instructor'
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Lesson videos policies (private bucket)
CREATE POLICY "Enrolled students can view lesson videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-videos'
  AND (
    -- Enrolled students
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id::text = (storage.foldername(name))[1]
      AND e.student_id = auth.uid()
    )
    -- Course instructors
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id::text = (storage.foldername(name))[1]
      AND c.instructor_id = auth.uid()
    )
    -- Admins
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Instructors can manage lesson videos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'lesson-videos'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'instructor'
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Lesson PDFs policies (private bucket)
CREATE POLICY "Enrolled students can view lesson PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-pdfs'
  AND (
    -- Enrolled students
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id::text = (storage.foldername(name))[1]
      AND e.student_id = auth.uid()
    )
    -- Course instructors
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id::text = (storage.foldername(name))[1]
      AND c.instructor_id = auth.uid()
    )
    -- Admins
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Instructors can manage lesson PDFs"
ON storage.objects FOR ALL
USING (
  bucket_id = 'lesson-pdfs'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'instructor'
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Course content policies (private bucket)
CREATE POLICY "Enrolled students can view course content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-content'
  AND (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id::text = (storage.foldername(name))[1]
      AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Instructors can manage course content"
ON storage.objects FOR ALL
USING (
  bucket_id = 'course-content'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'instructor'
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Certificates policies (private bucket)
CREATE POLICY "Students can view own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "System can create certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates');