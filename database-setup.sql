-- Muzimake Database Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create the song_requests table
CREATE TABLE IF NOT EXISTS song_requests (
    id SERIAL PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    celebration TEXT,
    genre TEXT,
    recipient_name TEXT,
    recipient_gender TEXT,
    relationship TEXT,
    story TEXT,
    vibe TEXT,
    mood TEXT,
    duration TEXT,
    special_instructions TEXT,
    audio_files TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'sent')),
    price DECIMAL(10,2),
    order_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_song_requests_created_at ON song_requests(created_at DESC);

-- Create an index on status for filtering
CREATE INDEX IF NOT EXISTS idx_song_requests_status ON song_requests(status);

-- Enable Row Level Security (RLS)
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users to insert (for form submissions)
CREATE POLICY "Allow anonymous inserts" ON song_requests
    FOR INSERT WITH CHECK (true);

-- Create a policy that allows authenticated users to read all records (for admin dashboard)
CREATE POLICY "Allow authenticated read" ON song_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy that allows authenticated users to update records (for admin dashboard)
CREATE POLICY "Allow authenticated update" ON song_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert some sample data for testing (optional)
INSERT INTO song_requests (
    customer_name, 
    customer_email, 
    customer_phone, 
    celebration, 
    genre, 
    recipient_name, 
    recipient_gender,
    relationship,
    mood,
    duration,
    special_instructions,
    status, 
    price,
    order_id
) VALUES 
(
    'Ahmed Al-Rashid',
    'ahmed@example.com',
    '+971501234567',
    'Wedding Anniversary',
    'Pop',
    'Fatima Al-Rashid',
    'Female',
    'Wife',
    'Romantic',
    '3-4 minutes',
    'Please include our wedding song melody in the beginning',
    'pending',
    31.50,
    'ORD-001'
),
(
    'Sarah Johnson',
    'sarah@example.com',
    '+971502345678',
    'Birthday',
    'Rock',
    'Mike Johnson',
    'Male',
    'Brother',
    'Energetic',
    '2-3 minutes',
    'He loves classic rock, please make it upbeat',
    'in_progress',
    31.50,
    'ORD-002'
),
(
    'Omar Hassan',
    'omar@example.com',
    '+971503456789',
    'Graduation',
    'Hip-Hop',
    'Layla Hassan',
    'Female',
    'Sister',
    'Celebratory',
    '3-4 minutes',
    'Include some Arabic lyrics if possible',
    'complete',
    31.50,
    'ORD-003'
),
(
    'Fatima Al-Zahra',
    'fatima@example.com',
    '+971504567890',
    'Mother''s Day',
    'Classical',
    'Amina Al-Zahra',
    'Female',
    'Mother',
    'Emotional',
    '4-5 minutes',
    'Make it very emotional and touching',
    'sent',
    31.50,
    'ORD-004'
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_song_requests_updated_at 
    BEFORE UPDATE ON song_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
