-- Add missing columns to profiles table for frontend compatibility
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_dars_data ON public.profiles USING gin (dars_data);
CREATE INDEX IF NOT EXISTS idx_profiles_cv_data ON public.profiles USING gin (cv_data);
CREATE INDEX IF NOT EXISTS idx_profiles_processing_status ON public.profiles USING gin (processing_status);

-- Update existing profiles to have email from auth.users if possible
UPDATE public.profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE public.profiles.id = auth.users.id 
AND public.profiles.email IS NULL;
