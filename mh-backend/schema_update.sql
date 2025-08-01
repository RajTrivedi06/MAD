-- Schema update for profiles table
-- Run this in Supabase Dashboard > SQL Editor

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dars_data jsonb,
ADD COLUMN IF NOT EXISTS cv_data jsonb,
ADD COLUMN IF NOT EXISTS processing_status jsonb DEFAULT '{"dars": "not_uploaded", "cv": "not_uploaded"}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_dars_data ON public.profiles USING gin (dars_data);
CREATE INDEX IF NOT EXISTS idx_profiles_cv_data ON public.profiles USING gin (cv_data);
CREATE INDEX IF NOT EXISTS idx_profiles_processing_status ON public.profiles USING gin (processing_status);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger (will replace if exists)
CREATE OR REPLACE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Make sure RLS (Row Level Security) allows service role to access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access (drop first if exists)
DROP POLICY IF EXISTS "Service role can do everything" ON public.profiles;
CREATE POLICY "Service role can do everything" ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create policy for authenticated users to access their own data (drop first if exists)
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
CREATE POLICY "Users can view and update their own profile" ON public.profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;