-- Fix conversation_participants RLS policy to allow creating conversations with other users
DROP POLICY IF EXISTS "Users can insert participants" ON conversation_participants;

CREATE POLICY "Users can insert conversation participants"
ON conversation_participants
FOR INSERT
WITH CHECK (
  -- Allow authenticated users to insert participants when creating conversations
  auth.uid() IS NOT NULL
);

-- Ensure lesson-pdfs bucket has proper access policies for enrolled students
DROP POLICY IF EXISTS "Students can view PDFs for enrolled courses" ON storage.objects;

CREATE POLICY "Students can view PDFs for enrolled courses"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-pdfs' AND
  (
    -- Allow access if user is enrolled in the course that owns this lesson
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE e.student_id = auth.uid()
      AND (storage.foldername(name))[1] = l.id::text
    )
    OR
    -- Allow instructors to access their own course PDFs
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE c.instructor_id = auth.uid()
      AND (storage.foldername(name))[1] = l.id::text
    )
  )
);

-- Add download policy for lesson videos (similar to PDFs)
DROP POLICY IF EXISTS "Students can view videos for enrolled courses" ON storage.objects;

CREATE POLICY "Students can view videos for enrolled courses"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-videos' AND
  (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE e.student_id = auth.uid()
      AND (storage.foldername(name))[1] = l.id::text
    )
    OR
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE c.instructor_id = auth.uid()
      AND (storage.foldername(name))[1] = l.id::text
    )
  )
);