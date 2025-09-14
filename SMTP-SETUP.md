# SMTP Email Configuration Setup

This guide explains how to set up SMTP email sending for Muzimake using Maileroo's SMTP service.

## 📧 **SMTP Configuration Details**

- **Host**: smtp.maileroo.com
- **Port**: 587 (STARTTLS) or 465 (SSL/TLS)
- **Authentication**: Yes
- **Email**: hello@muzimake.com
- **Password**: ef848dc8124c46364511bed9
- **Encryption**: STARTTLS (port 587) or SSL/TLS (port 465)

## 🚀 **Deployment Steps**

### **1. Install Dependencies**

The project now includes a `package.json` file with the required dependencies:

```bash
npm install
```

### **2. Deploy to Vercel**

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Add SMTP email functionality"
   git push origin main
   ```

2. **Vercel will automatically deploy** the new API endpoint

3. **Verify deployment** by checking:
   - API endpoint: `https://your-domain.vercel.app/api/send-email`
   - Admin dashboard: `https://your-domain.vercel.app/admin-dashboard-new.html`

### **3. Test the Email Functionality**

1. **Go to your admin dashboard**
2. **Upload an audio file** to any song request
3. **Click the "Send" button**
4. **Check the browser console** for success/error messages
5. **Verify the email** is received by the customer

## 🔧 **How It Works**

### **Frontend (Admin Dashboard)**
- User uploads audio file → Supabase Storage
- User clicks "Send" → Calls `/api/send-email` endpoint
- Receives confirmation and updates order status

### **Backend (API Endpoint)**
- Receives email data from frontend
- Connects to Maileroo SMTP server
- Sends beautifully formatted HTML email
- Returns success/error response

### **Email Template**
The email includes:
- ✅ Professional Muzimake branding
- ✅ Personalized greeting
- ✅ Song details (recipient, celebration, genre, voice gender)
- ✅ Direct link to download/listen to audio file
- ✅ Responsive design for all devices

## 🧪 **Testing Locally**

For local testing, you can use a tool like ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 8000

# Use the ngrok URL in your admin dashboard
```

## 🔒 **Security Notes**

- ✅ SMTP credentials are stored server-side only
- ✅ Email endpoint validates all input data
- ✅ CORS is handled by Vercel
- ✅ No sensitive data exposed to frontend

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Failed to send email"**
   - Check SMTP credentials
   - Verify Maileroo account status
   - Check Vercel deployment logs

2. **"API endpoint not found"**
   - Ensure `vercel.json` is properly configured
   - Check that `api/send-email.js` exists
   - Verify Vercel deployment includes the API folder

3. **"Authentication failed"**
   - Double-check email and password
   - Try different ports (587 vs 465)
   - Verify Maileroo account is active

### **Debug Steps:**

1. **Check Vercel logs:**
   - Go to Vercel dashboard → Functions tab
   - Look for error messages in the logs

2. **Test SMTP connection:**
   - Use an email client to test the SMTP settings
   - Verify credentials work outside the app

3. **Check browser console:**
   - Look for network errors
   - Check API response details

## 📋 **Files Modified/Created**

- ✅ `api/send-email.js` - SMTP email endpoint
- ✅ `package.json` - Dependencies (nodemailer)
- ✅ `vercel.json` - API routing configuration
- ✅ `admin-dashboard-new.html` - Updated to use SMTP endpoint
- ✅ `SMTP-SETUP.md` - This setup guide

## 🎯 **Next Steps**

1. **Deploy to Vercel** (git push)
2. **Test email functionality**
3. **Verify emails are received**
4. **Monitor for any issues**

The SMTP setup provides a more reliable and professional email delivery system compared to the API approach! 🎵
