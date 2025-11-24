-- Fix conversations and messages RLS policies
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON conversations;
CREATE POLICY "Users can view conversations they're part of"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update conversations" ON conversations;
CREATE POLICY "Users can update conversations"
ON conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Fix conversation_participants policies
DROP POLICY IF EXISTS "Users can view their participation" ON conversation_participants;
CREATE POLICY "Users can view their participation"
ON conversation_participants FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert participants" ON conversation_participants;
CREATE POLICY "Users can insert participants"
ON conversation_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their participation" ON conversation_participants;
CREATE POLICY "Users can update their participation"
ON conversation_participants FOR UPDATE
USING (user_id = auth.uid());

-- Fix messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());

-- Storage policies for lesson videos
-- Simplified approach: Allow enrolled students and instructors to access
DROP POLICY IF EXISTS "Authenticated users can view lesson videos" ON storage.objects;
CREATE POLICY "Authenticated users can view lesson videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-videos' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Instructors can manage lesson videos" ON storage.objects;
CREATE POLICY "Instructors can manage lesson videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-videos' AND
  (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Instructors can update lesson videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-videos' AND
  (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Instructors can delete lesson videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-videos' AND
  (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Storage policies for lesson PDFs
DROP POLICY IF EXISTS "Authenticated users can view lesson pdfs" ON storage.objects;
CREATE POLICY "Authenticated users can view lesson pdfs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-pdfs' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Instructors can manage lesson pdfs" ON storage.objects;
CREATE POLICY "Instructors can manage lesson pdfs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-pdfs' AND
  (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Instructors can update lesson pdfs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-pdfs' AND
  (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Instructors can delete lesson pdfs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-pdfs' AND
  (has_role(auth.uid(), 'instructor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);