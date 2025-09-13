# WhatsApp Business API Setup Guide

## Overview
This guide will help you set up WhatsApp Business API integration for your Muzimake admin dashboard to send MP3 files and messages to customers.

## Prerequisites
- Meta Business Manager account
- Verified business phone number
- Business verification documents
- Technical knowledge for API integration

## Setup Options

### Option 1: Direct Integration via Meta (Recommended for Developers)

#### Step 1: Create Meta Developer Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. Create a new app and select "Business" as the app type
4. Add the WhatsApp Business API product

#### Step 2: Business Verification
1. Complete business verification in Meta Business Manager
2. Provide required business documents
3. Wait for approval (can take 1-7 days)

#### Step 3: Phone Number Registration
1. Add a dedicated phone number for WhatsApp Business
2. Verify the number via SMS or phone call
3. Ensure the number isn't tied to an existing WhatsApp account

#### Step 4: Create Message Templates
For sending files and messages, you'll need approved templates:
```
Template Name: "song_delivery"
Category: Utility
Language: English
Content: "Hi {{1}}! Your custom song is ready. Here's your audio file: {{2}}"
```

#### Step 5: API Integration
You'll need to implement the following endpoints:

**Send Media Message:**
```javascript
const sendWhatsAppMessage = async (phoneNumber, message, audioFile) => {
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('to', phoneNumber);
  formData.append('type', 'document');
  formData.append('document', audioFile);
  formData.append('caption', message);
  
  const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: formData
  });
  
  return response.json();
};
```

### Option 2: Business Solution Provider (BSP) - Easier Setup

#### Recommended BSPs:
1. **Twilio** - Developer-friendly, good documentation
2. **MessageBird** - Easy integration, good support
3. **360Dialog** - WhatsApp-focused, reliable
4. **Zixflow** - User-friendly interface

#### BSP Setup Process:
1. Sign up with chosen BSP
2. Link your Meta Business Account
3. Follow BSP-specific integration guide
4. Use their SDK/API for sending messages

## Required Environment Variables

Add these to your server environment:

```env
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Optional: BSP credentials (if using BSP)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
```

## Backend Implementation

### Node.js/Express Example:

```javascript
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Send WhatsApp message with audio file
app.post('/api/send-whatsapp', upload.single('audio'), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const audioFile = req.file;
    
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('to', phoneNumber);
    formData.append('type', 'document');
    formData.append('document', fs.createReadStream(audioFile.path), {
      filename: audioFile.originalname,
      contentType: audioFile.mimetype
    });
    formData.append('caption', message);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: formData
      }
    );
    
    const result = await response.json();
    
    // Clean up uploaded file
    fs.unlinkSync(audioFile.path);
    
    res.json({ success: true, messageId: result.messages[0].id });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});
```

## Frontend Integration

Update the `sendWhatsapp` event listener in your admin dashboard:

```javascript
sendWhatsapp.addEventListener('click', async function() {
  if (!selectedFile || !currentRequest) return;
  
  const message = document.getElementById('whatsappMessage').value;
  const phoneNumber = currentRequest.customer_phone;
  
  if (!phoneNumber) {
    alert('No phone number available for this customer');
    return;
  }
  
  // Show loading state
  sendWhatsapp.disabled = true;
  sendWhatsapp.textContent = 'Sending...';
  
  try {
    const formData = new FormData();
    formData.append('phoneNumber', phoneNumber);
    formData.append('message', message);
    formData.append('audio', selectedFile);
    
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Message sent successfully!');
      closeWhatsappModalFunc();
    } else {
      alert('Failed to send message: ' + result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    sendWhatsapp.disabled = false;
    sendWhatsapp.textContent = 'Send via WhatsApp';
  }
});
```

## Pricing

WhatsApp Business API pricing is conversation-based:

### North America (USD):
- **Marketing**: $0.0250 per conversation
- **Utility**: $0.0150 per conversation  
- **Authentication**: $0.0135 per conversation
- **Service**: $0.0088 per conversation

### Free Tier:
- First 1,000 service conversations per month are free

## Compliance & Best Practices

1. **User Consent**: Ensure customers have opted in to receive messages
2. **Message Templates**: Use approved templates for business-initiated conversations
3. **Response Time**: Respond to customer messages within 24 hours
4. **File Size Limits**: WhatsApp supports files up to 100MB
5. **Supported Formats**: MP3, WAV, M4A, OGG for audio files

## Testing

1. Use WhatsApp's test phone numbers for development
2. Test with small file sizes first
3. Verify message delivery and file quality
4. Test error handling for invalid phone numbers

## Security Considerations

1. Store access tokens securely (environment variables)
2. Validate phone numbers before sending
3. Implement rate limiting to prevent abuse
4. Log all message attempts for audit purposes
5. Use HTTPS for all API communications

## Troubleshooting

### Common Issues:
1. **Invalid Phone Number**: Ensure phone numbers include country code
2. **File Too Large**: Compress audio files if over 100MB
3. **Template Not Approved**: Wait for template approval before sending
4. **Rate Limits**: Implement proper queuing for high volume

### Error Codes:
- `100`: Invalid parameter
- `131026`: Message undeliverable
- `131021`: Recipient cannot be messaged
- `131047`: Media download error

## Next Steps

1. Choose your integration method (Direct API or BSP)
2. Complete business verification
3. Set up message templates
4. Implement backend API endpoints
5. Test with sample data
6. Deploy to production

## Support Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Business API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

---

**Note**: This is a comprehensive setup guide. The actual implementation will depend on your chosen integration method and technical stack. Consider consulting with a developer experienced in WhatsApp Business API integration for production deployment.
