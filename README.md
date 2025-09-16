# Muzimake - Custom Songs Made Just for You

A professional platform for creating personalized custom songs with real musicians.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hijazimh/muzimake.git
   cd muzimake
   ```

2. **Set up environment variables**
   ```bash
   cp config/env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## 📁 Project Structure

```
muzimake/
├── 📄 index.html                 # Homepage
├── 📄 create-song.html           # Step 1: Song creation
├── 📄 create-song-step2.html     # Step 2: Song details
├── 📄 create-song-step3.html     # Step 3: Contact information
├── 📄 create-song-step4.html     # Step 4: Payment
├── 📄 payment-success.html       # Payment confirmation
├── 📄 how-it-works.html          # How it works page
├── 📄 privacy-policy.html        # Privacy policy
├── 📄 terms-of-use.html          # Terms of use
├── 📄 admin-login.html           # Admin login
├── 📄 admin-dashboard-new.html   # Admin dashboard
├── 📄 package.json               # Dependencies
├── 📄 vercel.json                # Vercel configuration
├── 📁 api/                       # API endpoints
│   └── send-email.js
├── 📁 config/                    # Configuration files
│   ├── config.js                 # Development config
│   ├── config.production.js      # Production config
│   └── env.example               # Environment variables template
├── 📁 database/                  # Database setup scripts
│   ├── complete-database-setup.sql
│   ├── database-setup.sql
│   └── ... (other SQL files)
├── 📁 docs/                      # Documentation
│   ├── README.md                 # Detailed documentation
│   ├── SECURITY.md               # Security guidelines
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── ... (other docs)
├── 📁 media/                     # Static assets
│   ├── logo-*.png                # Logo files
│   ├── *.mp3                     # Audio files
│   ├── *.jpeg                    # Image files
│   └── *.svg                     # Icon files
└── 📁 scripts/                   # Utility scripts
```

## 🔧 Configuration

### Environment Variables

Copy `config/env.example` to `.env.local` and configure:

```bash
# Supabase Configuration
SUPABASE_URL=https://lchleopfdvrgunbrlngh.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Ziina Payment Configuration
ZIINA_BASE_URL=https://api.ziina.com/api
ZIINA_API_KEY=your_ziina_api_key_here

# Admin Configuration
ADMIN_EMAIL=admin@muzimake.com
ADMIN_PASSWORD=your_secure_admin_password_here

# SMTP Configuration
SMTP_HOST=smtp.maileroo.com
SMTP_PORT=587
SMTP_USER=hello@muzimake.com
SMTP_PASS=your_smtp_password_here
```

### Stripe (Test vs Live)

Set these in Vercel → Environment Variables:

Required (live):
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

Optional (test mode switch):
- STRIPE_MODE = test
- STRIPE_SECRET_KEY_TEST
- STRIPE_WEBHOOK_SECRET_TEST

When STRIPE_MODE=test and the test keys/secrets are present, all API calls use test mode.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🔒 Security

- Comprehensive security headers implemented
- Content Security Policy (CSP) configured
- API keys managed via environment variables
- Input validation and sanitization
- See `docs/SECURITY.md` for detailed security guidelines

## 📈 SEO

- Optimized meta tags and structured data
- Open Graph and Twitter Card support
- Canonical URLs and sitemap
- Mobile-responsive design

## 🛠️ Development

### Local Development

```bash
# Start local server
python -m http.server 8000
# or
npx serve .
```

### Database Setup

1. Create Supabase project
2. Run SQL scripts from `database/` folder
3. Configure environment variables

## 📚 Documentation

- **Security**: `docs/SECURITY.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **Admin Setup**: `docs/ADMIN-SETUP.md`
- **Audio Upload**: `docs/AUDIO-UPLOAD-SETUP.md`
- **SMTP Setup**: `docs/SMTP-SETUP.md`

## 🎵 Features

- **Custom Song Creation**: 4-step process for personalized songs
- **Payment Integration**: Secure payment via Ziina
- **Admin Dashboard**: Manage orders and customers
- **Email Notifications**: Automated email system
- **Mobile Responsive**: Works on all devices
- **SEO Optimized**: Search engine friendly

## 🔗 Links

- **Live Site**: https://muzimake.com
- **Admin Panel**: https://muzimake.com/admin
- **Documentation**: See `docs/` folder

## 📞 Support

For support, contact: hello@muzimake.com

## 📄 License

© 2025 Muzimake. All rights reserved.
