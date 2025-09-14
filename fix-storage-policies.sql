-- Fix storage policies for audio uploads
-- Run this in your Supabase SQL Editor

-- First, let's disable RLS temporarily to allow uploads
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes" ON storage.objects;

-- Create new policies that work with anonymous users
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Allow anonymous updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'audio-files');

CREATE POLICY "Allow anonymous deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'audio-files');

-- Re-enable RLS with the new policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
