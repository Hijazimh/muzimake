# Audio Upload and Email Integration Setup Guide

This guide will help you set up the new audio upload functionality and email integration for the Muzimake admin dashboard.

## Prerequisites

- Supabase project with existing `song_requests` table
- Maileroo account and API key

## Step 1: Database Schema Updates

### 1.1 Add Audio File URL Column

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add audio_file_url column to existing song_requests table
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS audio_file_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN song_requests.audio_file_url IS 'URL to the uploaded audio file in Supabase Storage';

-- Create an index on audio_file_url for better performance
CREATE INDEX IF NOT EXISTS idx_song_requests_audio_file_url ON song_requests(audio_file_url);
```

Or use the provided file: `database/add-audio-file-url.sql`

## Step 2: Supabase Storage Setup

### 2.1 Create Audio Files Bucket

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create the audio-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/mp3']
);

-- Create policies for the bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'audio-files' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'audio-files' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'audio-files' AND 
    auth.role() = 'authenticated'
);
```

Or use the provided file: `database/supabase-storage-setup.sql`

### 2.2 Verify Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Verify that the `audio-files` bucket was created
4. Check that the bucket is public and has the correct file size limit (50MB)

## Step 3: Maileroo Integration

### 3.1 Get Your Maileroo API Key

1. Sign up for a Maileroo account at [maileroo.com](https://maileroo.com)
2. Go to your dashboard and find your API key
3. Copy the API key for the next step

### 3.2 Update the API Key

In the `admin-dashboard-new.html` file, find this line:

```javascript
'Authorization': 'Bearer YOUR_MAILEROO_API_KEY' // Replace with actual API key
```

Replace `YOUR_MAILEROO_API_KEY` with your actual Maileroo API key.

## Step 4: Features Overview

### 4.1 Audio Upload Functionality

- **File Types Supported**: MP3, WAV, M4A
- **File Size Limit**: 50MB
- **Upload Location**: Supabase Storage bucket `audio-files`
- **UI Features**:
  - Drag and drop upload area
  - Progress bar during upload
  - Success confirmation with file details
  - File validation (type and size)

### 4.2 Email Integration

- **Service**: Maileroo
- **Trigger**: Clicking the "Send" button (formerly "Mark as Sent")
- **Email Content**:
  - Personalized greeting
  - Song details (recipient, celebration, genre, voice gender)
  - Direct link to download/listen to the audio file
  - Professional Muzimake branding

### 4.3 Database Integration

- **New Field**: `audio_file_url` in `song_requests` table
- **Automatic Updates**: File URL is saved when upload completes
- **Status Management**: Order status changes to "sent" after email is sent

## Step 5: Testing

### 5.1 Test Audio Upload

1. Open the admin dashboard
2. Click "View" on any song request
3. In the modal, scroll down to the "mp3 File" section
4. Click the upload area and select an audio file
5. Verify the upload progress and success message
6. Check that the file URL appears in the success message

### 5.2 Test Email Sending

1. With an audio file uploaded, click the "Send" button
2. Verify that the email is sent successfully
3. Check the customer's email for the delivery
4. Verify that the order status changes to "sent"

## Step 6: Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check Supabase storage bucket exists
   - Verify storage policies are set correctly
   - Check file size (must be under 50MB)
   - Verify file type is supported

2. **Email Sending Fails**
   - Verify Maileroo API key is correct
   - Check Maileroo account has sufficient credits
   - Verify customer email address is valid

3. **Database Errors**
   - Ensure `audio_file_url` column exists
   - Check Supabase connection and permissions
   - Verify RLS policies allow updates

### Debug Mode

To enable debug logging, open browser developer tools and check the console for error messages.

## Step 7: Security Considerations

1. **File Validation**: Only audio files are accepted
2. **Size Limits**: 50MB maximum file size
3. **Access Control**: Files are publicly readable but only authenticated users can upload
4. **API Key Security**: Keep your Maileroo API key secure and don't commit it to version control

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify all setup steps were completed correctly
3. Test with a small audio file first
4. Check Supabase and Maileroo service status

## Files Modified

- `admin-dashboard-new.html` - Main admin dashboard with upload and email functionality
- `database/database-setup.sql` - Updated with audio_file_url column
- `database/add-audio-file-url.sql` - Migration script for existing databases
- `database/supabase-storage-setup.sql` - Storage bucket and policies setup
