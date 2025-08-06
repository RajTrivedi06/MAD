# Authentication Debugging Guide

This guide provides comprehensive solutions for debugging authentication issues in the MAD project.

## 🔍 Quick Diagnostic Steps

### 1. Check Environment Variables

First, verify your environment variables are properly set:

```bash
# In your mh-frontend directory, create .env.local if it doesn't exist
touch .env.local
```

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Browser Console Testing

Open your browser console and run these tests:

```javascript
// Test 1: Environment variables
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Has Anon Key:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Test 2: Comprehensive auth test
testAuth();

// Test 3: Test sign up (replace with your test data)
testSignUp("test@example.com", "password123", "Test", "User");

// Test 4: Test sign in
testSignIn("test@example.com", "password123");
```

## 🛠️ Common Issues & Solutions

### Issue 1: Environment Variables Not Loading

**Symptoms:**

- "Missing Supabase environment variables" error
- Authentication fails completely

**Solution:**

1. Ensure `.env.local` exists in `mh-frontend` directory
2. Variable names must start with `NEXT_PUBLIC_`
3. Restart your development server after adding environment variables

```bash
# Stop the dev server
Ctrl+C

# Restart
npm run dev
```

### Issue 2: Profile Creation Race Condition

**Symptoms:**

- User gets created but profile doesn't
- "Error creating profile" in console
- User can't access protected features

**Solution:**
The updated `createProfile` function now uses `upsert` instead of `insert` to handle race conditions. This should resolve most profile creation issues.

### Issue 3: Session Management Issues

**Symptoms:**

- User appears logged out after page refresh
- Session not persisting
- Authentication state inconsistent

**Solution:**
The updated AuthContext includes better session verification and error handling. Check the browser console for detailed logs.

### Issue 4: CORS and Redirect URL Issues

**Symptoms:**

- OAuth providers not working
- "Invalid redirect URL" errors

**Solution:**

1. Go to your Supabase dashboard
2. Navigate to Authentication → URL Configuration
3. Add these URLs:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
   - Your production URLs when deploying

### Issue 5: Database Permissions (RLS)

**Symptoms:**

- "Row Level Security policy violation" errors
- Can't read/write profile data

**Solution:**
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- If RLS is enabled, ensure proper policies exist:
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🔧 Debug Components

### AuthDebug Component

The `AuthDebug` component shows real-time authentication status in development mode. It displays:

- Loading state
- User ID and email
- Session status
- Environment variable status
- LocalStorage token status

### Console Test Functions

Use these functions in the browser console:

```javascript
// Comprehensive auth test
testAuth();

// Test profile creation
testProfileCreation("user-id", "email@example.com");

// Test sign in
testSignIn("email@example.com", "password");

// Test sign up
testSignUp("email@example.com", "password", "First", "Last");
```

## 📊 Network Tab Investigation

1. Open browser DevTools → Network tab
2. Try to sign in/sign up
3. Look for these requests:
   - `auth/v1/signup` or `auth/v1/token` - Should return 200
   - `rest/v1/profiles` - Check the response
4. Check for any 401, 403, or CORS errors

## 🐛 Step-by-Step Debugging

### Step 1: Environment Check

```javascript
console.log("Environment Check:", {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing",
  urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
  keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
});
```

### Step 2: Supabase Connection Test

```javascript
// Test if Supabase is accessible
const { supabase } = await import("@/lib/supabase/client");
const { data, error } = await supabase
  .from("profiles")
  .select("count")
  .limit(1);
console.log("Connection test:", error ? "Failed" : "Success");
```

### Step 3: Session Verification

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Session exists:", session ? "Yes" : "No");
```

### Step 4: Profile Check

```javascript
if (session?.user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  console.log("Profile exists:", profile ? "Yes" : "No");
}
```

## 🚨 Emergency Fixes

### If Authentication Completely Broken:

1. **Clear all data:**

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

2. **Check Supabase dashboard:**

   - Go to Authentication → Users
   - Verify users are being created
   - Check for any error logs

3. **Verify database schema:**

```sql
-- Run in Supabase SQL Editor
SELECT * FROM profiles LIMIT 1;
```

### If Profile Creation Failing:

1. **Manual profile creation:**

```javascript
// In browser console (replace with actual user ID)
testProfileCreation("actual-user-id", "user@example.com");
```

2. **Check RLS policies:**

```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 📞 Getting Help

1. **Check browser console** for detailed error messages
2. **Use the AuthDebug component** for real-time status
3. **Run console test functions** for step-by-step diagnosis
4. **Check Supabase dashboard logs** for server-side errors
5. **Verify environment variables** are properly set

## 🔄 Testing Flow

1. Start development server: `npm run dev`
2. Open browser console
3. Run `testAuth()` to check current status
4. Try signing up with test credentials
5. Check AuthDebug component for real-time status
6. Verify profile creation in Supabase dashboard

## 📝 Common Error Messages

- **"Missing Supabase environment variables"**: Check `.env.local` file
- **"Row Level Security policy violation"**: Check RLS policies in Supabase
- **"Invalid API key"**: Verify environment variables
- **"Invalid redirect URL"**: Check Supabase URL configuration
- **"Profile creation failed"**: Check database permissions and RLS policies

---

**Remember**: Most authentication issues are related to environment variables, RLS policies, or race conditions in profile creation. The updated code includes better error handling and logging to help identify these issues quickly.
