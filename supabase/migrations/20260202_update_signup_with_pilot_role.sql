-- ============================================
-- UPDATE SIGNUP FUNCTION TO INCLUDE PILOT_ROLE
-- This allows setting pilot_role during signup via metadata
-- ============================================

-- Update the handle_new_user function to include pilot_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, pilot_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate'),
    COALESCE(NEW.raw_user_meta_data->>'pilot_role', 'pilot_user') -- Default to pilot_user
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Creates profile on signup, including pilot_role from metadata';
