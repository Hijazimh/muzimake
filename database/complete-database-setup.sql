-- Complete Database Setup for Muzimake
-- Run this SQL in your Supabase SQL Editor to set up the complete database structure

-- ==============================================
-- 1. CREATE USERS TABLE
-- ==============================================

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT, -- Store hashed password for backup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Authenticated users can insert their own data
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Admin users can read all user data (for admin dashboard)
CREATE POLICY "Admin can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@muzimake.com'
        )
    );

-- Admin users can update all user data
CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@muzimake.com'
        )
    );

-- ==============================================
-- 2. UPDATE SONG_REQUESTS TABLE
-- ==============================================

-- Add new columns to song_requests table
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS customer_password TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add comments to explain the fields
COMMENT ON COLUMN song_requests.customer_password IS 'Customer password for account creation (stored after successful payment)';
COMMENT ON COLUMN song_requests.user_id IS 'Reference to the users table (not auth.users directly)';
COMMENT ON COLUMN song_requests.payment_id IS 'Payment ID from payment processor';

-- ==============================================
-- 3. CREATE TRIGGERS AND FUNCTIONS
-- ==============================================

-- Create a function to automatically create user record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, full_name, phone, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update the updated_at timestamp for users
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column for users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at_column();

-- ==============================================
-- 4. CREATE ADMIN VIEW
-- ==============================================

-- Create a view for admin dashboard that joins users and song_requests
CREATE OR REPLACE VIEW admin_song_requests AS
SELECT 
    sr.*,
    u.full_name as user_full_name,
    u.email as user_email,
    u.phone as user_phone,
    u.created_at as user_created_at,
    u.is_active as user_is_active,
    u.email_verified as user_email_verified
FROM song_requests sr
LEFT JOIN users u ON sr.user_id = u.id
ORDER BY sr.created_at DESC;

-- Grant permissions for the view
GRANT SELECT ON admin_song_requests TO authenticated;

-- ==============================================
-- 5. INSERT SAMPLE DATA (OPTIONAL)
-- ==============================================

-- Update existing sample data to include passwords
UPDATE song_requests 
SET customer_password = 'sample_password_123' 
WHERE customer_password IS NULL;

-- ==============================================
-- 6. VERIFICATION QUERIES
-- ==============================================

-- Verify the setup by running these queries:

-- Check if users table exists and has correct structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

-- Check if song_requests table has new columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'song_requests' 
-- AND column_name IN ('customer_password', 'user_id', 'payment_id');

-- Check if admin view works
-- SELECT COUNT(*) FROM admin_song_requests;

-- Check if triggers are created
-- SELECT trigger_name, event_manipulation, action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' 
-- AND trigger_name IN ('on_auth_user_created', 'update_users_updated_at');

-- ==============================================
-- SETUP COMPLETE!
-- ==============================================

-- Your database is now ready with:
-- ✅ Users table with proper relationships
-- ✅ Updated song_requests table with user references
-- ✅ Automatic user creation triggers
-- ✅ Admin view for dashboard
-- ✅ Proper RLS policies
-- ✅ Sample data updated

-- Next steps:
-- 1. Test the account creation flow
-- 2. Verify admin dashboard shows user information
-- 3. Test user login functionality
