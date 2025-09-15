-- Add audio_file_url column to existing song_requests table
-- Run this SQL in your Supabase SQL Editor

-- Add the audio_file_url column
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS audio_file_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN song_requests.audio_file_url IS 'URL to the uploaded audio file in Supabase Storage';

-- Create an index on audio_file_url for better performance
CREATE INDEX IF NOT EXISTS idx_song_requests_audio_file_url ON song_requests(audio_file_url);
