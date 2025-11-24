-- Create storage buckets for the application
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('course-thumbnails', 'course-thumbnails', true),
  ('lesson-videos', 'lesson-videos', false),
  ('lesson-pdfs', 'lesson-pdfs', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course thumbnails (public)
CREATE POLICY "Course thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Instructors can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can update their course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can delete their course thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for lesson videos (private)
CREATE POLICY "Enrolled students can view lesson videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-videos'
  AND (
    -- Instructors can view their own videos
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Enrolled students can view
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE l.id::text = (storage.foldername(name))[2]
      AND e.student_id = auth.uid()
    )
    OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Instructors can upload lesson videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can update their lesson videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can delete their lesson videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for lesson PDFs (private)
CREATE POLICY "Enrolled students can view lesson PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-pdfs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE l.id::text = (storage.foldername(name))[2]
      AND e.student_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Instructors can upload lesson PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can update their lesson PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can delete their lesson PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-pdfs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for avatars (public)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Insert 12 popular categories
INSERT INTO public.categories (name, description) VALUES
  ('البرمجة والتطوير', 'تعلم لغات البرمجة، تطوير الويب، تطوير التطبيقات والمزيد'),
  ('الأعمال وريادة الأعمال', 'إدارة الأعمال، ريادة الأعمال، المشاريع الناشئة والاستثمار'),
  ('التصميم', 'التصميم الجرافيكي، تصميم واجهات المستخدم، التصميم ثلاثي الأبعاد'),
  ('التسويق', 'التسويق الرقمي، التسويق عبر وسائل التواصل، استراتيجيات التسويق'),
  ('التطوير الشخصي', 'مهارات القيادة، الإنتاجية، تطوير الذات والتحفيز'),
  ('التصوير والفيديو', 'التصوير الفوتوغرافي، تحرير الفيديو، الإنتاج السينمائي'),
  ('الموسيقى', 'العزف على الآلات، نظريات الموسيقى، الإنتاج الموسيقي'),
  ('اللغات', 'تعلم اللغات الأجنبية، الترجمة والمحادثة'),
  ('الصحة واللياقة', 'اللياقة البدنية، التغذية، اليوغا والصحة العامة'),
  ('التعليم والتدريس', 'طرق التدريس، التعليم عن بعد، إدارة الفصول الدراسية'),
  ('التمويل والمحاسبة', 'المحاسبة، التمويل الشخصي، الاستثمار والتحليل المالي'),
  ('علوم البيانات والذكاء الاصطناعي', 'تحليل البيانات، التعلم الآلي، الذكاء الاصطناعي والبيانات الضخمة')
ON CONFLICT (name) DO NOTHING;