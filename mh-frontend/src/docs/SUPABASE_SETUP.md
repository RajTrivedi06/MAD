# Supabase Setup Guide

This guide will help you set up Supabase authentication for the MAD project.

## Prerequisites

- A Supabase account ([create one here](https://supabase.com))
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter your project details:
   - Name: `mad-project` (or your preferred name)
   - Database Password: Generate a secure password
   - Region: Choose the closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Keys

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: This will be your `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key**: This will be your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Set Up Environment Variables

1. In your `mh-frontend` directory, create a `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Additional environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Replace the placeholder values with your actual Supabase project URL and anon key.

## Step 4: Set Up Database Schema

Run the following SQL in your Supabase SQL Editor to create the profiles table:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Step 5: Configure OAuth Providers (Optional)

To enable Google and GitHub sign-in:

### Google OAuth

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Get them from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add your redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`

### GitHub OAuth

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **GitHub** provider
3. Add your GitHub OAuth app credentials:
   - Create an OAuth app in [GitHub Settings](https://github.com/settings/applications/new)
   - Add your redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 6: Configure Email Settings

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure your **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - Add your production URLs when deploying

## Step 7: Test Your Setup

1. Start your development server:

```bash
cd mh-frontend
npm run dev
```

2. Navigate to `http://localhost:3000/register`
3. Try creating a new account
4. Check your Supabase dashboard to see if the user was created

## Features Implemented

✅ **User Registration**: Sign up with email and password  
✅ **User Login**: Sign in with email and password  
✅ **Password Reset**: Forgot password functionality  
✅ **OAuth Login**: Google and GitHub sign-in  
✅ **Profile Management**: User profiles with metadata  
✅ **Protected Routes**: Authentication-based route protection  
✅ **Modern UI**: Dark theme matching project design

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Double-check your environment variables
2. **OAuth not working**: Ensure redirect URIs are correctly configured
3. **Email not sending**: Configure email templates in Supabase dashboard
4. **Profile not created**: Check if the trigger function is working

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check the browser console for detailed error messages

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Enable Row Level Security (RLS) on all tables
- Regularly rotate your service keys
