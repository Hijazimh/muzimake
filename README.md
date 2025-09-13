# Muzimake - Custom Song Creation Platform

A beautiful, responsive website for creating custom songs with a complete admin dashboard for order management.

## 🎵 Features

- **Multi-step Song Creation Form**: 3-step process for collecting song preferences
- **Admin Dashboard**: Complete CMS for managing song requests
- **Supabase Integration**: Real-time database for order management
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Video Backgrounds**: Engaging hero sections with video backgrounds
- **Music Player**: Interactive song examples with play/pause functionality

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Netlify
- **Icons**: Custom SVG icons and Figma assets

## 📁 Project Structure

```
muzimake/
├── index.html                 # Homepage
├── create-song.html          # Step 1: Song preferences
├── create-song-step2.html    # Step 2: Recipient details
├── create-song-step3.html    # Step 3: Contact & payment
├── how-it-works.html         # How it works page
├── admin-login.html          # Admin login page
├── admin-dashboard.html      # Admin dashboard
├── supabase-test.html        # Database connection test
├── database-setup.sql        # Database setup script
├── media/                    # Assets folder
│   ├── *.mp4                 # Video files
│   ├── *.mp3                 # Audio files
│   ├── *.jpeg                # Image files
│   └── *.svg                 # SVG icons
└── README.md                 # This file
```

## 🚀 Deployment

This project is deployed on Netlify and automatically builds from the main branch.

### Live URLs:
- **Website**: https://muzimake.com
- **Admin Dashboard**: https://muzimake.com/admin-login.html

## 🔧 Setup Instructions

### 1. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `database-setup.sql`

### 2. Admin Access
- **URL**: https://muzimake.com/admin-login.html
- **Email**: admin@muzimake.com
- **Password**: admin123

### 3. Testing
- Use the test page: https://muzimake.com/supabase-test.html
- Create test orders through the form
- Manage orders in the admin dashboard

## 📊 Database Schema

The `song_requests` table includes:
- Customer information (name, email, phone)
- Song details (celebration, genre, recipient)
- Order status and pricing
- Timestamps for tracking

## 🎨 Design Features

- **Responsive Navigation**: Sticky navbar with blur effects
- **Video Backgrounds**: Engaging hero sections
- **Interactive Forms**: Multi-step form with validation
- **Admin Dashboard**: Complete order management system
- **Mobile-First**: Optimized for all device sizes

## 🔒 Security

- Row Level Security (RLS) enabled on Supabase
- Anonymous users can submit orders
- Authenticated users can manage orders
- Secure API key management

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Performance

- Optimized images and videos
- Minified CSS and JavaScript
- CDN delivery via Netlify
- Fast loading times

## 📞 Support

For technical support or questions, please contact the development team.

---

**Muzimake** - Your story. Your song. 🎵
