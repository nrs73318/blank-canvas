-- Fix: Ensure all existing users without roles get a default student role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- Update trigger to always ensure new users get their role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Ensure user has a role (this is a safety net)
  -- The actual role is set by the signUp function in AuthContext
  -- This just ensures no user is left without a role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;