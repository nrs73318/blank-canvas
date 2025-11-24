-- Drop the existing foreign key that references auth.users
ALTER TABLE public.courses
DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

-- Add new foreign key that references profiles table
ALTER TABLE public.courses
ADD CONSTRAINT courses_instructor_id_fkey 
FOREIGN KEY (instructor_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;