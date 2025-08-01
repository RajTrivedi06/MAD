#!/usr/bin/env python3

import time
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('Testing Supabase performance...')

# Test 1: Simple query
start = time.time()
try:
    result = supabase.table('courses').select('*').limit(5).execute()
    simple_time = time.time() - start
    print(f'Simple query: {simple_time:.2f}s, {len(result.data)} courses')
except Exception as e:
    print(f'Simple query error: {e}')

# Test 2: Network test
start = time.time()  
try:
    result = supabase.table('courses').select('course_code').limit(1).execute()
    network_time = time.time() - start
    print(f'Network test: {network_time:.2f}s')
except Exception as e:
    print(f'Network error: {e}')

# Test 3: Count
start = time.time()
try:
    result = supabase.table('courses').select('*', count='exact').limit(1).execute()
    count_time = time.time() - start
    print(f'Count query: {count_time:.2f}s, total: {result.count}')
except Exception as e:
    print(f'Count error: {e}')

print('Done!')