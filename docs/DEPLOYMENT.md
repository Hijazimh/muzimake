# 🚀 Muzimake Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Files Ready for Deployment:
- [x] All HTML pages (index.html, create-song.html, etc.)
- [x] All media files (videos, images, audio)
- [x] Database setup script (database/database-setup.sql)
- [x] Vercel configuration (vercel.json)
- [x] README.md and documentation

## 🔧 GitHub Repository Setup

### 1. Create New Repository
1. Go to GitHub.com and create a new repository
2. Name it: `muzimake` or `muzimake-website`
3. Make it **Public** (required for free Vercel)
4. Don't initialize with README (we already have one)

### 2. Upload Files to GitHub
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit: Muzimake website"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/muzimake.git
git push -u origin main
```

## 🌐 Vercel Setup

### 1. Connect to GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Choose "Import Git Repository"
4. Select your `muzimake` repository
5. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (root directory)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `.` (root directory)
6. Click "Deploy"

### 2. Custom Domain Setup
1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Click "Add Domain"
4. Enter: `muzimake.com`
5. Vercel will provide DNS instructions

## 🔧 GoDaddy DNS Configuration

### DNS Records to Add in GoDaddy:

#### 1. A Record (Root Domain)
- **Type**: A
- **Name**: @
- **Value**: `76.76.19.61` (Vercel's IP)
- **TTL**: 600 (10 minutes)

#### 2. CNAME Record (WWW Subdomain)
- **Type**: CNAME
- **Name**: www
- **Value**: `cname.vercel-dns.com`
- **TTL**: 600 (10 minutes)

### Step-by-Step GoDaddy Instructions:

1. **Login to GoDaddy**
   - Go to [godaddy.com](https://godaddy.com)
   - Login to your account
   - Go to "My Products"

2. **Access DNS Management**
   - Find your `muzimake.com` domain
   - Click "DNS" or "Manage DNS"

3. **Add/Update Records**
   - Delete any existing A records for @
   - Add the two records above
   - Save changes

4. **Wait for Propagation**
   - DNS changes can take 24-48 hours
   - Usually works within 1-2 hours

## 🗄️ Database Setup (Supabase)

### 1. Production Database
1. Go to your Supabase dashboard
2. Create a new project for production (or use existing)
3. Go to SQL Editor
4. Run the `database/database-setup.sql` script

### 2. Update API Keys
1. Get your production Supabase URL and API key
2. Update the keys in all HTML files:
   - `create-song-step3.html`
   - `admin-dashboard-new.html`
   - `create-song-step4.html`

## 🔒 SSL Certificate

Vercel automatically provides SSL certificates:
- ✅ HTTPS enabled by default
- ✅ Automatic certificate renewal
- ✅ HTTP to HTTPS redirects

## 🧪 Testing Your Live Site

### 1. Test URLs
- **Homepage**: https://muzimake.com
- **WWW**: https://www.muzimake.com
- **Admin**: https://muzimake.com/admin-login.html
- **Dashboard**: https://muzimake.com/admin-dashboard-new.html

### 2. Test Functions
- [ ] Form submission works
- [ ] Admin dashboard loads
- [ ] Database connection works
- [ ] All media files load
- [ ] Mobile responsiveness
- [ ] Payment flow works

## 🚨 Troubleshooting

### Common Issues:

#### 1. Domain Not Working
- **Check DNS propagation**: Use [whatsmydns.net](https://whatsmydns.net)
- **Verify DNS records**: Make sure all records are correct
- **Wait longer**: DNS can take up to 48 hours

#### 2. SSL Certificate Issues
- **Wait for certificate**: Vercel needs time to issue certificate
- **Check domain verification**: Ensure DNS records are correct

#### 3. Database Connection Issues
- **Check API keys**: Verify Supabase URL and key are correct
- **Test database**: Use the test page to verify connection
- **Check RLS policies**: Ensure database permissions are correct

#### 4. Admin Dashboard Issues
- **Check redirects**: Ensure all admin links point to correct files
- **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
- **Check authentication**: Verify admin login credentials

## 📞 Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Use the test page to verify database connection
3. Check browser console for errors
4. Verify DNS propagation status

## 🎉 Success!

Once everything is working:
- ✅ Your site is live at muzimake.com
- ✅ Admin dashboard is accessible
- ✅ Orders are being saved to database
- ✅ SSL certificate is active
- ✅ Mobile responsive design works
- ✅ Payment flow is functional

**Congratulations! Your Muzimake website is now live! 🎵**