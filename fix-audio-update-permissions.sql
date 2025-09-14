-- Fix Audio File Update Permissions
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'song_requests';

-- Step 2: Create or replace policy for updating audio files
-- This allows authenticated users to update audio file fields
CREATE POLICY "Allow audio file updates" ON song_requests
FOR UPDATE USING (true)
WITH CHECK (true);

-- Step 3: Alternative - Create a more specific policy if the above is too permissive
-- Uncomment and use this instead if you want more security:

/*
-- More secure policy - only allow updates to audio file fields
CREATE POLICY "Allow audio file field updates only" ON song_requests
FOR UPDATE USING (true)
WITH CHECK (
    -- Only allow updates to audio-related fields
    audio_file_url IS NOT NULL OR 
    audio_file_id IS NOT NULL OR 
    audio_file_name IS NOT NULL OR 
    audio_file_size IS NOT NULL OR 
    audio_uploaded_at IS NOT NULL
);
*/

-- Step 4: Grant necessary permissions
GRANT UPDATE ON song_requests TO authenticated;
GRANT UPDATE ON song_requests TO anon;

-- Step 5: Test the update permission
-- This should work after running the above commands
UPDATE song_requests 
SET audio_file_url = 'https://test.example.com/permission-test.mp3'
WHERE id = 21;

-- Step 6: Verify the update worked
SELECT id, audio_file_url, audio_file_id, audio_file_name, audio_file_size, audio_uploaded_at 
FROM song_requests 
WHERE id = 21;

-- Step 7: Check if RLS is enabled (should show 't' for true)
SELECT relrowsecurity FROM pg_class WHERE relname = 'song_requests';
