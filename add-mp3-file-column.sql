-- Add MP3 file URL column to song_requests table
-- Run this SQL in your Supabase SQL Editor

-- Add the mp3_file_url column
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS mp3_file_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN song_requests.mp3_file_url IS 'URL to the uploaded MP3 file in Supabase Storage';

-- Create an index for better performance when querying by file URL
CREATE INDEX IF NOT EXISTS idx_song_requests_mp3_file_url ON song_requests(mp3_file_url);

-- Update the admin_song_requests view to include the new column
DROP VIEW IF EXISTS admin_song_requests;

CREATE VIEW admin_song_requests AS
SELECT 
    sr.*,
    u.full_name as user_full_name,
    u.email as user_email,
    u.phone as user_phone
FROM song_requests sr
LEFT JOIN users u ON sr.user_id = u.id
ORDER BY sr.created_at DESC;

-- Grant permissions for the view
GRANT SELECT ON admin_song_requests TO authenticated;
GRANT SELECT ON admin_song_requests TO anon;
