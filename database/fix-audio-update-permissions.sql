-- Fix RLS policies to allow anonymous users to update audio files
-- This is needed because the admin dashboard uses the anon key

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated update" ON song_requests;
DROP POLICY IF EXISTS "Allow authenticated read" ON song_requests;

-- Create new policies that allow both authenticated and anonymous users
CREATE POLICY "Allow all users to read" ON song_requests
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to update" ON song_requests
    FOR UPDATE USING (true) WITH CHECK (true);

-- Grant explicit permissions to both roles
GRANT SELECT, UPDATE ON song_requests TO authenticated;
GRANT SELECT, UPDATE ON song_requests TO anon;

-- Also ensure we can update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_song_requests_updated_at ON song_requests;
CREATE TRIGGER update_song_requests_updated_at
    BEFORE UPDATE ON song_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();