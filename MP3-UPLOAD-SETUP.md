# 🎵 MP3 Upload & Email Setup Guide

## 📋 Overview
This guide will help you set up the MP3 upload functionality and email sending feature in your Muzimake admin dashboard.

## 🗄️ Database Setup

### 1. Add MP3 File URL Column
Run the SQL script in your Supabase SQL Editor:
```sql
-- Run: add-mp3-file-column.sql
```

### 2. Create Storage Bucket
Run the storage setup script:
```sql
-- Run: setup-storage-bucket.sql
```

## 📧 Email Service Setup (Maileroo)

### 1. Create Maileroo Account
1. Go to [maileroo.com](https://maileroo.com)
2. Sign up for an account
3. Verify your email address

### 2. Get API Key
1. Go to API Keys section in Maileroo dashboard
2. Create a new API key
3. Copy the API key

### 3. Add Environment Variable
In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add new variable:
   - **Name**: `MAILEROO_API_KEY`
   - **Value**: Your Maileroo API key

### 4. Verify Domain (Optional but Recommended)
1. In Maileroo dashboard, go to "Domains"
2. Add your domain (e.g., `muzimake.com`)
3. Follow DNS verification steps
4. This allows you to send emails from `noreply@muzimake.com`

## 🚀 Deployment

### 1. Install Dependencies
```bash
# No additional dependencies needed for Maileroo
npm install
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

## 🧪 Testing

### 1. Test File Upload
1. Go to admin dashboard
2. Open an order details modal
3. Try uploading an MP3 file
4. Verify file appears in Supabase Storage

### 2. Test Email Sending
1. Upload an MP3 file to an order
2. Click "Send" button
3. Check customer's email for the song
4. Verify email contains attachment

## 🔧 Features

### ✅ MP3 Upload
- **Drag & Drop**: Drag MP3 files directly to upload area
- **Click to Upload**: Click upload area to select files
- **File Validation**: Only MP3 files, max 50MB
- **Progress Indicator**: Shows upload progress
- **File Preview**: Shows uploaded file with delete option

### ✅ Email Sending
- **Professional Template**: Beautiful HTML email template
- **File Attachment**: MP3 file attached to email
- **Download Link**: Direct download link in email
- **Order Details**: Includes order ID and recipient info
- **Status Update**: Automatically updates order status to "sent"

### ✅ File Management
- **Supabase Storage**: Files stored in secure cloud storage
- **Database Tracking**: File URLs stored in database
- **File Deletion**: Can delete uploaded files
- **Persistent Storage**: Files persist across sessions

## 🐛 Troubleshooting

### File Upload Issues
- **Check Supabase Storage**: Verify bucket exists and has correct permissions
- **Check File Size**: Ensure file is under 50MB
- **Check File Type**: Only MP3 files are allowed
- **Check Console**: Look for JavaScript errors

### Email Issues
- **Check API Key**: Verify MAILEROO_API_KEY is set correctly
- **Check Domain**: Ensure domain is verified in Maileroo
- **Check Logs**: Check Vercel function logs for errors
- **Test API**: Test the `/api/send-email` endpoint directly

### Database Issues
- **Check Column**: Verify `mp3_file_url` column exists
- **Check Permissions**: Ensure RLS policies allow updates
- **Check View**: Verify `admin_song_requests` view includes new column

## 📁 File Structure
```
├── api/
│   └── send-email.js          # Email sending API endpoint
├── add-mp3-file-column.sql    # Database migration
├── setup-storage-bucket.sql   # Storage bucket setup
├── package.json               # Dependencies
├── vercel.json               # Vercel configuration
└── admin-dashboard-new.html   # Updated admin dashboard
```

## 🔐 Security Notes
- Files are stored in Supabase Storage with proper access controls
- Maileroo API key is stored as environment variable
- File uploads are validated for type and size
- Database updates are protected by RLS policies

## 📞 Support
If you encounter any issues:
1. Check the browser console for errors
2. Check Vercel function logs
3. Verify all environment variables are set
4. Ensure database migrations are applied
