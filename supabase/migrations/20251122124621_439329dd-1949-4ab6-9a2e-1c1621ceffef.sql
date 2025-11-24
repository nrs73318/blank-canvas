-- Fix conversations table RLS policy for better insert permissions
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure conversation_participants allows inserting participants when creating conversation
DROP POLICY IF EXISTS "Users can insert conversation participants" ON public.conversation_participants;

CREATE POLICY "Users can insert conversation participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix storage policies for lesson PDFs - enrolled students can view
DROP POLICY IF EXISTS "Enrolled students can view lesson PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can manage lesson PDFs" ON storage.objects;

CREATE POLICY "Enrolled students can view lesson PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-pdfs' 
  AND (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE l.pdf_url LIKE '%' || name || '%'
        AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.pdf_url LIKE '%' || name || '%'
        AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  )
);

CREATE POLICY "Instructors can manage lesson PDFs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'lesson-pdfs'
  AND EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.pdf_url LIKE '%' || name || '%'
      AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  bucket_id = 'lesson-pdfs'
  AND EXISTS (
    SELECT 1 FROM courses c
    WHERE c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin')
  )
);

-- Fix storage policies for lesson videos
DROP POLICY IF EXISTS "Enrolled students can view lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can manage lesson videos" ON storage.objects;

CREATE POLICY "Enrolled students can view lesson videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-videos'
  AND (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE l.video_url LIKE '%' || name || '%'
        AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.video_url LIKE '%' || name || '%'
        AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  )
);

CREATE POLICY "Instructors can manage lesson videos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'lesson-videos'
  AND EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.video_url LIKE '%' || name || '%'
      AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  bucket_id = 'lesson-videos'
  AND EXISTS (
    SELECT 1 FROM courses c
    WHERE c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin')
  )
);