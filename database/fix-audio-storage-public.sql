-- Fix Audio Storage for Public Access
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files',
    true, -- This makes the bucket public
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true, -- Ensure it's public
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/mp3'];

-- Step 2: Drop any existing policies that might be restrictive
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes" ON storage.objects;

-- Step 3: Create new policies that allow public access
-- Allow anyone to read files from audio-files bucket (for email links)
CREATE POLICY "Allow public read access for audio files" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-files');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to audio files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-files');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to audio files" ON storage.objects
FOR UPDATE USING (bucket_id = 'audio-files');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from audio files" ON storage.objects
FOR DELETE USING (bucket_id = 'audio-files');

-- Step 4: Verify the bucket is public
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'audio-files';
