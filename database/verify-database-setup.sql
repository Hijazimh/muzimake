-- Verify Database Setup for Muzimake
-- Run this SQL in your Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if users table exists
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check if song_requests table has the new columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'song_requests' 
AND column_name IN ('customer_password', 'user_id', 'payment_id')
ORDER BY column_name;

-- 3. Check if triggers exist
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN ('on_auth_user_created', 'update_users_updated_at');

-- 4. Check if admin view exists
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_name = 'admin_song_requests';

-- 5. Check RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';

-- 6. Count existing users
SELECT COUNT(*) as user_count FROM users;

-- 7. Count existing song requests
SELECT COUNT(*) as song_request_count FROM song_requests;

-- 8. Show sample users (if any)
SELECT 
    id, 
    email, 
    full_name, 
    created_at,
    is_active
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Show sample song requests with user info
SELECT 
    sr.id,
    sr.customer_name,
    sr.customer_email,
    sr.status,
    u.full_name as user_full_name,
    u.email as user_email
FROM song_requests sr
LEFT JOIN users u ON sr.user_id = u.id
ORDER BY sr.created_at DESC 
LIMIT 5;
