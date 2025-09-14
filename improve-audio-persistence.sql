-- Improve Audio File Persistence in Database
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add new columns for better audio file tracking
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS audio_file_id TEXT,
ADD COLUMN IF NOT EXISTS audio_file_name TEXT,
ADD COLUMN IF NOT EXISTS audio_file_size BIGINT,
ADD COLUMN IF NOT EXISTS audio_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Add comments to describe the new columns
COMMENT ON COLUMN song_requests.audio_file_id IS 'Unique identifier for the audio file in storage';
COMMENT ON COLUMN song_requests.audio_file_name IS 'Original filename of the uploaded audio file';
COMMENT ON COLUMN song_requests.audio_file_size IS 'Size of the audio file in bytes';
COMMENT ON COLUMN song_requests.audio_uploaded_at IS 'Timestamp when the audio file was uploaded';

-- Step 3: Create index on audio_file_id for better performance
CREATE INDEX IF NOT EXISTS idx_song_requests_audio_file_id ON song_requests(audio_file_id);

-- Step 4: Create a function to get audio file info
CREATE OR REPLACE FUNCTION get_audio_file_info(request_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    audio_file_url TEXT,
    audio_file_id TEXT,
    audio_file_name TEXT,
    audio_file_size BIGINT,
    audio_uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id,
        sr.audio_file_url,
        sr.audio_file_id,
        sr.audio_file_name,
        sr.audio_file_size,
        sr.audio_uploaded_at
    FROM song_requests sr
    WHERE sr.id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'song_requests' 
AND column_name LIKE 'audio%'
ORDER BY column_name;

-- Step 6: Test the function (replace 1 with an actual request ID)
-- SELECT * FROM get_audio_file_info(1);
