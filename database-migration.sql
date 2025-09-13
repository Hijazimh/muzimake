-- Migration script to add missing columns to existing song_requests table
-- Run this SQL in your Supabase SQL Editor

-- Add missing columns to the existing song_requests table
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS story TEXT,
ADD COLUMN IF NOT EXISTS vibe TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE;

-- Create an index on order_id for better performance
CREATE INDEX IF NOT EXISTS idx_song_requests_order_id ON song_requests(order_id);

-- Update existing records to have a default order_id if they don't have one
UPDATE song_requests 
SET order_id = 'MZ' || id || '_' || EXTRACT(EPOCH FROM created_at)::bigint
WHERE order_id IS NULL;
