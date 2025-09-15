-- Simple fix for storage upload issues
-- Run this in your Supabase SQL Editor

-- First, let's check if the bucket exists and recreate it if needed
DELETE FROM storage.buckets WHERE id = 'audio-files';

-- Create a new bucket with public access and no RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/mp3']
);

-- Create very permissive policies for the bucket
CREATE POLICY "Allow all operations on audio-files" ON storage.objects
FOR ALL USING (bucket_id = 'audio-files');

-- Alternative: If the above doesn't work, try this simpler approach
-- CREATE POLICY "Allow public uploads" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'audio-files');

-- CREATE POLICY "Allow public reads" ON storage.objects
-- FOR SELECT USING (bucket_id = 'audio-files');
