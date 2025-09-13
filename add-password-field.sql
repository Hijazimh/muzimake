-- Add password and user_id fields to song_requests table
-- Run this SQL in your Supabase SQL Editor

-- Add password column to the song_requests table
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS customer_password TEXT;

-- Add user_id column to link orders to user accounts
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add payment_id column to track payment
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add comments to explain the fields
COMMENT ON COLUMN song_requests.customer_password IS 'Customer password for account creation (stored after successful payment)';
COMMENT ON COLUMN song_requests.user_id IS 'Reference to the user account created after payment';
COMMENT ON COLUMN song_requests.payment_id IS 'Payment ID from payment processor';

-- Update the sample data to include passwords (optional)
UPDATE song_requests 
SET customer_password = 'sample_password_123' 
WHERE customer_password IS NULL;
