-- Create storage buckets for the e-learning platform

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Course content bucket (private, for videos, documents, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-content',
  'course-content',
  false,
  524288000, -- 500MB for videos
  ARRAY['video/mp4', 'video/webm', 'application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- Course thumbnails bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-thumbnails',
  'course-thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Certificates bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
);

-- RLS Policies for avatars bucket
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for course-thumbnails bucket
CREATE POLICY "Course thumbnails are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Instructors can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  public.has_role(auth.uid(), 'instructor')
);

CREATE POLICY "Instructors can update course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails' AND
  public.has_role(auth.uid(), 'instructor')
);

CREATE POLICY "Instructors can delete course thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-thumbnails' AND
  public.has_role(auth.uid(), 'instructor')
);

-- RLS Policies for course-content bucket
CREATE POLICY "Enrolled students can view course content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-content' AND
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = auth.uid()
  )
);

CREATE POLICY "Instructors can manage course content"
ON storage.objects FOR ALL
USING (
  bucket_id = 'course-content' AND
  public.has_role(auth.uid(), 'instructor')
);

-- RLS Policies for certificates bucket
CREATE POLICY "Users can view their own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "System can create certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates');

-- Add course thumbnail_url column to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add avatar_url and bio columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;