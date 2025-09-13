# 🚀 Muzimake Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Files Ready for Deployment:
- [x] All HTML pages (index.html, create-song.html, etc.)
- [x] All media files (videos, images, audio)
- [x] Database setup script (database-setup.sql)
- [x] Netlify configuration (netlify.toml)
- [x] README.md and documentation

## 🔧 GitHub Repository Setup

### 1. Create New Repository
1. Go to GitHub.com and create a new repository
2. Name it: `muzimake` or `muzimake-website`
3. Make it **Public** (required for free Netlify)
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

## 🌐 Netlify Setup

### 1. Connect to GitHub
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" as your Git provider
4. Select your `muzimake` repository
5. Configure build settings:
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `.` (root directory)
6. Click "Deploy site"

### 2. Custom Domain Setup
1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Enter: `muzimake.com`
4. Netlify will provide DNS instructions

## 🔧 GoDaddy DNS Configuration

### DNS Records to Add in GoDaddy:

#### 1. A Record (Root Domain)
- **Type**: A
- **Name**: @
- **Value**: `75.2.60.5` (Netlify's IP)
- **TTL**: 600 (10 minutes)

#### 2. CNAME Record (WWW Subdomain)
- **Type**: CNAME
- **Name**: www
- **Value**: `muzimake.netlify.app`
- **TTL**: 600 (10 minutes)

#### 3. CNAME Record (Netlify Verification)
- **Type**: CNAME
- **Name**: _netlify
- **Value**: `muzlify.netlify.app`
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
   - Add the three records above
   - Save changes

4. **Wait for Propagation**
   - DNS changes can take 24-48 hours
   - Usually works within 1-2 hours

## 🗄️ Database Setup (Supabase)

### 1. Production Database
1. Go to your Supabase dashboard
2. Create a new project for production (or use existing)
3. Go to SQL Editor
4. Run the `database-setup.sql` script

### 2. Update API Keys
1. Get your production Supabase URL and API key
2. Update the keys in all HTML files:
   - `create-song-step3.html`
   - `admin-dashboard.html`
   - `supabase-test.html`

## 🔒 SSL Certificate

Netlify automatically provides SSL certificates:
- ✅ HTTPS enabled by default
- ✅ Automatic certificate renewal
- ✅ HTTP to HTTPS redirects

## 🧪 Testing Your Live Site

### 1. Test URLs
- **Homepage**: https://muzimake.com
- **WWW**: https://www.muzimake.com
- **Admin**: https://muzimake.com/admin-login.html
- **Test Page**: https://muzimake.com/supabase-test.html

### 2. Test Functions
- [ ] Form submission works
- [ ] Admin dashboard loads
- [ ] Database connection works
- [ ] All media files load
- [ ] Mobile responsiveness

## 🚨 Troubleshooting

### Common Issues:

#### 1. Domain Not Working
- **Check DNS propagation**: Use [whatsmydns.net](https://whatsmydns.net)
- **Verify DNS records**: Make sure all records are correct
- **Wait longer**: DNS can take up to 48 hours

#### 2. SSL Certificate Issues
- **Wait for certificate**: Netlify needs time to issue certificate
- **Check domain verification**: Ensure DNS records are correct

#### 3. Database Connection Issues
- **Check API keys**: Verify Supabase URL and key are correct
- **Test database**: Use the test page to verify connection
- **Check RLS policies**: Ensure database permissions are correct

## 📞 Support

If you encounter any issues:
1. Check Netlify deployment logs
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

**Congratulations! Your Muzimake website is now live! 🎵**
