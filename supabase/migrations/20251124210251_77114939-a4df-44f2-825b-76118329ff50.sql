-- Add missing fields to match existing code expectations

-- Add is_read to conversation_participants
ALTER TABLE public.conversation_participants 
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Add duration_hours to courses
ALTER TABLE public.courses 
ADD COLUMN duration_hours DECIMAL(5,2);

-- Update courses trigger to include new field
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();