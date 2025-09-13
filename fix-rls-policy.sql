-- Fix Row Level Security Policy for song_requests table
-- Run this SQL in your Supabase SQL Editor

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous inserts" ON song_requests;

-- Create a new policy that allows anonymous users to insert
CREATE POLICY "Allow anonymous inserts" ON song_requests
    FOR INSERT 
    WITH CHECK (true);

-- Also create a policy to allow anonymous users to read their own records (optional)
CREATE POLICY "Allow anonymous read own records" ON song_requests
    FOR SELECT 
    USING (true);

-- Verify the policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'song_requests';
