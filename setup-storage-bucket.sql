-- Setup Supabase Storage Bucket for MP3 Files
-- Run this SQL in your Supabase SQL Editor

-- Create the storage bucket for song files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'song-files',
    'song-files',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3'];

-- Create storage policies for the song-files bucket

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload song files" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'song-files' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view song files" ON storage.objects
FOR SELECT USING (
    bucket_id = 'song-files' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated users to update song files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'song-files' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete song files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'song-files' 
    AND auth.role() = 'authenticated'
);

-- Allow public access to view files (for email attachments)
CREATE POLICY "Allow public access to view song files" ON storage.objects
FOR SELECT USING (bucket_id = 'song-files');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
