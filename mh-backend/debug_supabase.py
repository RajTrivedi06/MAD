#!/usr/bin/env python3
"""
Debug script to test Supabase connection and permissions
Run this after updating your service role key
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test if Supabase is properly configured and accessible"""
    
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not url or not key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file")
        return False
    
    print(f"🔗 Supabase URL: {url}")
    print(f"🔑 Service Key: {key[:20]}...")
    
    try:
        # Create Supabase client
        supabase: Client = create_client(url, key)
        print("✅ Supabase client created successfully")
        
        # Test basic read access
        result = supabase.table('profiles').select("id").limit(1).execute()
        print(f"✅ Can read from profiles table. Found {len(result.data)} rows")
        
        # Test write access (insert a test row)
        test_data = {
            'id': '00000000-0000-0000-0000-000000000000',  # Test UUID
            'email': 'test@example.com',
            'full_name': 'Test User',
            'dars_data': {'test': True},
            'cv_data': {'test': True},
            'processing_status': {'dars': 'test', 'cv': 'test'}
        }
        
        # Try to upsert (this will fail gracefully if row exists)
        try:
            result = supabase.table('profiles').upsert(test_data).execute()
            print("✅ Can write to profiles table")
            
            # Clean up test data
            supabase.table('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000').execute()
            print("✅ Cleaned up test data")
            
        except Exception as write_error:
            print(f"❌ Cannot write to profiles table: {write_error}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def check_table_schema():
    """Check if the profiles table has all required columns"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    
    supabase: Client = create_client(url, key)
    
    try:
        # Get table schema information
        result = supabase.table('profiles').select("*").limit(1).execute()
        
        if result.data:
            columns = list(result.data[0].keys())
            print(f"📋 Current profiles table columns: {columns}")
            
            required_columns = ['id', 'email', 'dars_data', 'cv_data', 'processing_status']
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                print(f"❌ Missing required columns: {missing_columns}")
                print("\n📝 Run this SQL in Supabase to add missing columns:")
                print("ALTER TABLE public.profiles")
                for col in missing_columns:
                    if col in ['dars_data', 'cv_data', 'processing_status']:
                        print(f"ADD COLUMN IF NOT EXISTS {col} jsonb,")
                print("ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();")
            else:
                print("✅ All required columns are present")
                
        else:
            print("⚠️ No data in profiles table to check schema")
            
    except Exception as e:
        print(f"❌ Error checking table schema: {e}")

if __name__ == "__main__":
    print("🔍 Testing Supabase Configuration...\n")
    
    if test_supabase_connection():
        print("\n🔍 Checking table schema...\n")
        check_table_schema()
        print("\n✅ Supabase is properly configured!")
    else:
        print("\n❌ Please fix Supabase configuration and try again")
        print("\n💡 Make sure you're using the SERVICE ROLE key, not the anon key")