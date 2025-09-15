-- Supabase Storage Setup for Audio Files
-- Run this SQL in your Supabase SQL Editor

-- Create the audio-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/mp3']
);

-- Create a policy that allows authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'audio-files' AND 
    auth.role() = 'authenticated'
);

-- Create a policy that allows public access to read files
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-files');

-- Create a policy that allows authenticated users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'audio-files' AND 
    auth.role() = 'authenticated'
);

-- Create a policy that allows authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'audio-files' AND 
    auth.role() = 'authenticated'
);
