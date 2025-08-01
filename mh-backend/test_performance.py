#!/usr/bin/env python3
"""
Test Supabase query performance
"""

import time
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🔍 Testing query performance...\n')

# Test 1: Simple courses query
print('1️⃣ Testing simple courses query...')
start = time.time()
try:
    result = supabase.table('courses').select('*').limit(5).execute()
    simple_time = time.time() - start
    print(f'✅ Simple query: {simple_time:.2f}s, {len(result.data)} courses found')
    if result.data:
        sample_course = result.data[0]
        print(f'   Sample: {sample_course.get("course_code", "N/A")} - {sample_course.get("title", "N/A")}')
except Exception as e:
    print(f'❌ Simple query failed: {e}')

print()

# Test 2: Complex join query (like frontend)
print('2️⃣ Testing complex join query (like frontend)...')
start = time.time()
try:
    query_text = """
        *,
        requirement_popularity!inner (
            percent_taken,
            student_count,
            requirement
        )
    """
    result = supabase.from("courses").select(query_text).limit(5).execute()
    join_time = time.time() - start
    print(f'✅ Join query: {join_time:.2f}s, {len(result.data)} courses found')
    if result.data:
        sample_course = result.data[0]
        print(f'   Sample: {sample_course.get("course_code", "N/A")} - {sample_course.get("title", "N/A")}')
        print(f'   Popularity data: {sample_course.get("requirement_popularity", "None")}')
except Exception as e:
    print(f'❌ Join query failed: {e}')

print()

# Test 3: Count total courses
print('3️⃣ Testing total count...')
start = time.time()
try:
    result = supabase.table('courses').select('*', count='exact').limit(1).execute()
    count_time = time.time() - start
    print(f'✅ Count query: {count_time:.2f}s, total courses: {result.count}')
except Exception as e:
    print(f'❌ Count query failed: {e}')

print()

# Test 4: Frontend network connectivity
print('4️⃣ Testing network connectivity to Supabase...')
start = time.time()
try:
    result = supabase.table('courses').select('course_code,title').limit(1).execute()
    network_time = time.time() - start
    print(f'✅ Network test: {network_time:.2f}s')
    if network_time > 2.0:
        print('⚠️  Slow network connection detected (>2s)')
    elif network_time > 1.0:
        print('⚠️  Moderate network latency (>1s)')
    else:
        print('✅ Good network performance')
except Exception as e:
    print(f'❌ Network test failed: {e}')

print()
print('📊 Performance Summary:')
print('- Simple queries should be <0.5s')
print('- Join queries should be <2s') 
print('- Network should be <1s')
print('- If all tests are slow, check your internet connection to Supabase')
print('- If only join queries are slow, consider adding database indexes')