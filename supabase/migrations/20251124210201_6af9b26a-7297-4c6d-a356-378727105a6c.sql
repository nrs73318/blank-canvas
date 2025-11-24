-- ============================================================================
-- LEARNHUB LMS PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================

-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.lesson_type AS ENUM ('video', 'text', 'quiz', 'pdf');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.course_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- ============================================================================
-- USER MANAGEMENT TABLES
-- ============================================================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COURSE CATALOG TABLES
-- ============================================================================

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  level course_level NOT NULL DEFAULT 'beginner',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  preview_video_url TEXT,
  objectives TEXT[],
  requirements TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT false,
  status course_status NOT NULL DEFAULT 'draft',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  video_url TEXT,
  pdf_url TEXT,
  lesson_type lesson_type NOT NULL DEFAULT 'video',
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STUDENT ENGAGEMENT TABLES
-- ============================================================================

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Lesson progress table
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Wishlists table
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ASSESSMENT TABLES
-- ============================================================================

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Lesson comments table
CREATE TABLE public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADMINISTRATIVE TABLES
-- ============================================================================

-- Complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status complaint_status NOT NULL DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Course review history table
CREATE TABLE public.course_review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  status course_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_review_history ENABLE ROW LEVEL SECURITY;

-- Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  certificate_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY DEFINER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Roles are viewable by everyone" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON public.categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Courses policies
CREATE POLICY "Approved courses are viewable by everyone" ON public.courses
  FOR SELECT USING (
    is_published = true AND status = 'approved'
    OR instructor_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can create courses" ON public.courses
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'instructor') 
    AND instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can update own courses" ON public.courses
  FOR UPDATE USING (
    instructor_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only admins can delete courses" ON public.courses
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Lessons policies
CREATE POLICY "Lessons viewable by enrolled or preview" ON public.lessons
  FOR SELECT USING (
    is_preview = true
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = lessons.course_id 
      AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can manage own course lessons" ON public.lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Enrollments policies
CREATE POLICY "Students can view own enrollments" ON public.enrollments
  FOR SELECT USING (
    student_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students can enroll themselves" ON public.enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own enrollments" ON public.enrollments
  FOR UPDATE USING (student_id = auth.uid());

-- Lesson progress policies
CREATE POLICY "Students can view own progress" ON public.lesson_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = lesson_progress.enrollment_id 
      AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own progress" ON public.lesson_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = lesson_progress.enrollment_id 
      AND e.student_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Enrolled students can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = reviews.course_id 
      AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own reviews" ON public.reviews
  FOR UPDATE USING (
    student_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students can delete own reviews" ON public.reviews
  FOR DELETE USING (
    student_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Wishlists policies
CREATE POLICY "Students can view own wishlist" ON public.wishlists
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can manage own wishlist" ON public.wishlists
  FOR ALL USING (student_id = auth.uid());

-- Quizzes policies
CREATE POLICY "Quizzes viewable by enrolled students" ON public.quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id = quizzes.lesson_id 
      AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can manage course quizzes" ON public.quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Quiz questions policies
CREATE POLICY "Quiz questions viewable by enrolled" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.id = q.lesson_id
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE q.id = quiz_questions.quiz_id 
      AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.id = q.lesson_id
      JOIN public.courses c ON c.id = l.course_id
      WHERE q.id = quiz_questions.quiz_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.id = q.lesson_id
      JOIN public.courses c ON c.id = l.course_id
      WHERE q.id = quiz_questions.quiz_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Quiz attempts policies
CREATE POLICY "Students can view own attempts" ON public.quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create own attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Conversations policies
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation participants policies
CREATE POLICY "Participants can view themselves" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id 
      AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participation" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Senders can update own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Senders can delete own messages" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- Lesson comments policies
CREATE POLICY "Comments viewable by enrolled students" ON public.lesson_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id = lesson_comments.lesson_id 
      AND e.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = lesson_comments.lesson_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Enrolled students can comment" ON public.lesson_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id = lesson_comments.lesson_id 
      AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own comments" ON public.lesson_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.lesson_comments
  FOR DELETE USING (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Complaints policies
CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own complaints" ON public.complaints
  FOR UPDATE USING (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Course review history policies
CREATE POLICY "History viewable by instructors and admins" ON public.course_review_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_review_history.course_id 
      AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can create review history" ON public.course_review_history
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Certificates policies
CREATE POLICY "Students can view own certificates" ON public.certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = certificates.enrollment_id 
      AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "System can create certificates" ON public.certificates
  FOR INSERT WITH CHECK (true);

-- Payments policies
CREATE POLICY "Students can view own payments" ON public.payments
  FOR SELECT USING (
    student_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students can create payments" ON public.payments
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert role (default to student if not specified)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply update_updated_at trigger to tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_lesson_comments_updated_at
  BEFORE UPDATE ON public.lesson_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_category ON public.courses(category_id);
CREATE INDEX idx_courses_published ON public.courses(is_published);
CREATE INDEX idx_courses_status ON public.courses(status);

CREATE INDEX idx_lessons_course ON public.lessons(course_id);

CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);

CREATE INDEX idx_reviews_course ON public.reviews(course_id);

CREATE INDEX idx_payments_student ON public.payments(student_id);

CREATE INDEX idx_lesson_comments_lesson_id ON public.lesson_comments(lesson_id);
CREATE INDEX idx_lesson_comments_parent_id ON public.lesson_comments(parent_id);

CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

CREATE INDEX idx_course_review_history_course_id ON public.course_review_history(course_id);

-- ============================================================================
-- REAL-TIME CONFIGURATION
-- ============================================================================

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Set replica identity for realtime updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;

-- ============================================================================
-- INITIAL DATA: CATEGORIES
-- ============================================================================

-- Insert main categories
INSERT INTO public.categories (id, name, description, parent_id, icon, slug) VALUES
('c1000000-0000-0000-0000-000000000001', 'Computer Science & IT', 'Programming, web development, data science, and more', NULL, '💻', 'computer-science-it'),
('c1000000-0000-0000-0000-000000000002', 'Business & Management', 'Business skills, entrepreneurship, and management', NULL, '💼', 'business-management'),
('c1000000-0000-0000-0000-000000000003', 'Design & Creativity', 'Graphic design, UI/UX, and creative arts', NULL, '🎨', 'design-creativity'),
('c1000000-0000-0000-0000-000000000004', 'Engineering & Technology', 'Mechanical, electrical, and civil engineering', NULL, '⚙️', 'engineering-technology'),
('c1000000-0000-0000-0000-000000000005', 'Languages', 'Learn new languages and improve communication', NULL, '🌍', 'languages'),
('c1000000-0000-0000-0000-000000000006', 'Science & Mathematics', 'Physics, chemistry, biology, and mathematics', NULL, '🔬', 'science-mathematics'),
('c1000000-0000-0000-0000-000000000007', 'Soft Skills', 'Communication, leadership, and personal development', NULL, '🤝', 'soft-skills'),
('c1000000-0000-0000-0000-000000000008', 'Education & Teaching', 'Teaching methods, curriculum development', NULL, '📚', 'education-teaching'),
('c1000000-0000-0000-0000-000000000009', 'Personal Development', 'Self-improvement and life skills', NULL, '🌟', 'personal-development'),
('c1000000-0000-0000-0000-000000000010', 'Lifestyle & Hobbies', 'Cooking, fitness, photography, and more', NULL, '🎯', 'lifestyle-hobbies');

-- Insert subcategories for Computer Science & IT
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Web Development', 'HTML, CSS, JavaScript, React, Node.js', 'c1000000-0000-0000-0000-000000000001', '🌐', 'web-development'),
('Mobile Development', 'iOS, Android, React Native, Flutter', 'c1000000-0000-0000-0000-000000000001', '📱', 'mobile-development'),
('Data Science', 'Python, R, Machine Learning, AI', 'c1000000-0000-0000-0000-000000000001', '📊', 'data-science'),
('Cybersecurity', 'Network security, ethical hacking', 'c1000000-0000-0000-0000-000000000001', '🔒', 'cybersecurity'),
('Cloud Computing', 'AWS, Azure, Google Cloud', 'c1000000-0000-0000-0000-000000000001', '☁️', 'cloud-computing'),
('Database Administration', 'SQL, NoSQL, Database design', 'c1000000-0000-0000-0000-000000000001', '💾', 'database-administration');

-- Insert subcategories for Business & Management
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Entrepreneurship', 'Starting and growing businesses', 'c1000000-0000-0000-0000-000000000002', '🚀', 'entrepreneurship'),
('Project Management', 'Agile, Scrum, project planning', 'c1000000-0000-0000-0000-000000000002', '📋', 'project-management'),
('Marketing', 'Digital marketing, SEO, social media', 'c1000000-0000-0000-0000-000000000002', '📢', 'marketing'),
('Finance & Accounting', 'Financial analysis, bookkeeping', 'c1000000-0000-0000-0000-000000000002', '💰', 'finance-accounting'),
('Human Resources', 'Recruitment, employee management', 'c1000000-0000-0000-0000-000000000002', '👥', 'human-resources');

-- Insert subcategories for Design & Creativity
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Graphic Design', 'Adobe Photoshop, Illustrator', 'c1000000-0000-0000-0000-000000000003', '🎨', 'graphic-design'),
('UI/UX Design', 'User interface and experience design', 'c1000000-0000-0000-0000-000000000003', '🖥️', 'ui-ux-design'),
('Video Production', 'Video editing, animation', 'c1000000-0000-0000-0000-000000000003', '🎬', 'video-production'),
('Photography', 'Digital photography, photo editing', 'c1000000-0000-0000-0000-000000000003', '📷', 'photography'),
('3D Modeling', 'Blender, Maya, 3D animation', 'c1000000-0000-0000-0000-000000000003', '🎭', 'three-d-modeling');

-- Insert subcategories for Engineering & Technology
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Mechanical Engineering', 'CAD, manufacturing, mechanics', 'c1000000-0000-0000-0000-000000000004', '⚙️', 'mechanical-engineering'),
('Electrical Engineering', 'Circuits, power systems', 'c1000000-0000-0000-0000-000000000004', '⚡', 'electrical-engineering'),
('Civil Engineering', 'Construction, structural design', 'c1000000-0000-0000-0000-000000000004', '🏗️', 'civil-engineering'),
('Robotics', 'Automation, robot programming', 'c1000000-0000-0000-0000-000000000004', '🤖', 'robotics');

-- Insert subcategories for Languages
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('English', 'English language learning', 'c1000000-0000-0000-0000-000000000005', '🇬🇧', 'english'),
('Spanish', 'Spanish language learning', 'c1000000-0000-0000-0000-000000000005', '🇪🇸', 'spanish'),
('French', 'French language learning', 'c1000000-0000-0000-0000-000000000005', '🇫🇷', 'french'),
('German', 'German language learning', 'c1000000-0000-0000-0000-000000000005', '🇩🇪', 'german'),
('Mandarin Chinese', 'Mandarin Chinese learning', 'c1000000-0000-0000-0000-000000000005', '🇨🇳', 'mandarin-chinese'),
('Arabic', 'Arabic language learning', 'c1000000-0000-0000-0000-000000000005', '🇸🇦', 'arabic');

-- Insert subcategories for Science & Mathematics
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Physics', 'Classical and modern physics', 'c1000000-0000-0000-0000-000000000006', '⚛️', 'physics'),
('Chemistry', 'Organic, inorganic chemistry', 'c1000000-0000-0000-0000-000000000006', '🧪', 'chemistry'),
('Biology', 'Life sciences, anatomy', 'c1000000-0000-0000-0000-000000000006', '🧬', 'biology'),
('Mathematics', 'Algebra, calculus, statistics', 'c1000000-0000-0000-0000-000000000006', '📐', 'mathematics'),
('Environmental Science', 'Ecology, sustainability', 'c1000000-0000-0000-0000-000000000006', '🌱', 'environmental-science');

-- Insert subcategories for Soft Skills
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Communication Skills', 'Public speaking, presentation', 'c1000000-0000-0000-0000-000000000007', '💬', 'communication-skills'),
('Leadership', 'Team management, decision making', 'c1000000-0000-0000-0000-000000000007', '👔', 'leadership'),
('Time Management', 'Productivity, organization', 'c1000000-0000-0000-0000-000000000007', '⏰', 'time-management'),
('Critical Thinking', 'Problem solving, analysis', 'c1000000-0000-0000-0000-000000000007', '🧠', 'critical-thinking');

-- Insert subcategories for Education & Teaching
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Teaching Methods', 'Pedagogy, instructional design', 'c1000000-0000-0000-0000-000000000008', '👨‍🏫', 'teaching-methods'),
('Curriculum Development', 'Course design, assessment', 'c1000000-0000-0000-0000-000000000008', '📖', 'curriculum-development'),
('Educational Technology', 'E-learning, LMS platforms', 'c1000000-0000-0000-0000-000000000008', '💻', 'educational-technology');

-- Insert subcategories for Personal Development
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Self-Confidence', 'Building confidence, self-esteem', 'c1000000-0000-0000-0000-000000000009', '💪', 'self-confidence'),
('Goal Setting', 'Planning, achievement strategies', 'c1000000-0000-0000-0000-000000000009', '🎯', 'goal-setting'),
('Mindfulness', 'Meditation, stress management', 'c1000000-0000-0000-0000-000000000009', '🧘', 'mindfulness'),
('Career Development', 'Job search, career planning', 'c1000000-0000-0000-0000-000000000009', '📈', 'career-development');

-- Insert subcategories for Lifestyle & Hobbies
INSERT INTO public.categories (name, description, parent_id, icon, slug) VALUES
('Cooking & Culinary Arts', 'Recipes, cooking techniques', 'c1000000-0000-0000-0000-000000000010', '🍳', 'cooking-culinary-arts'),
('Fitness & Exercise', 'Workout routines, nutrition', 'c1000000-0000-0000-0000-000000000010', '🏋️', 'fitness-exercise'),
('Music', 'Instruments, music theory', 'c1000000-0000-0000-0000-000000000010', '🎵', 'music'),
('Arts & Crafts', 'DIY projects, crafting', 'c1000000-0000-0000-0000-000000000010', '✂️', 'arts-crafts'),
('Gardening', 'Plant care, landscaping', 'c1000000-0000-0000-0000-000000000010', '🌺', 'gardening'),
('Travel', 'Travel planning, culture', 'c1000000-0000-0000-0000-000000000010', '✈️', 'travel');