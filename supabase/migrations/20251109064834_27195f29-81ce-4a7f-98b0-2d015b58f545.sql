-- Fix the handle_new_user trigger to not assign default student role
-- The signUp function will handle role assignment instead
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create profile, don't assign role here
  -- Role will be assigned by the signUp function
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  RETURN NEW;
END;
$function$;