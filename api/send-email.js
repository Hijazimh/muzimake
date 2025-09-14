// Maileroo API configuration
const MAILEROO_API_KEY = process.env.MAILEROO_API_KEY;
const MAILEROO_BASE_URL = 'https://api.maileroo.com/v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      to, 
      customerName, 
      recipientName, 
      mp3FileUrl, 
      fileName, 
      orderId 
    } = req.body;

    // Validate required fields
    if (!to || !customerName || !recipientName || !mp3FileUrl || !fileName || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Download the MP3 file from Supabase Storage
    const fileResponse = await fetch(mp3FileUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to download MP3 file');
    }
    
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString('base64');

    // Send email with attachment using Maileroo
    const emailData = {
      from: {
        email: 'noreply@muzimake.com',
        name: 'Muzimake'
      },
      to: [
        {
          email: to,
          name: customerName
        }
      ],
      subject: `🎵 Your Custom Song is Ready! - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Custom Song is Ready!</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              color: #fc6900;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              color: #232321;
              margin-bottom: 20px;
            }
            .content {
              margin-bottom: 30px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
            }
            .song-info {
              background: #f3f1eb;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: 600;
              color: #232321;
            }
            .attachment-info {
              background: #e8f5e8;
              border: 2px solid #4caf50;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .download-btn {
              display: inline-block;
              background: #fc6900;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: 600;
              margin-top: 15px;
              transition: background-color 0.3s;
            }
            .download-btn:hover {
              background: #e55a00;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-links a {
              color: #fc6900;
              text-decoration: none;
              margin: 0 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Muzimake</div>
              <h1 class="title">🎵 Your Custom Song is Ready!</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${customerName},</p>
              
              <p>Great news! Your custom song for <strong>${recipientName}</strong> is ready and attached to this email.</p>
              
              <div class="song-info">
                <div class="info-item">
                  <span class="info-label">Order ID:</span> ${orderId}
                </div>
                <div class="info-item">
                  <span class="info-label">Recipient:</span> ${recipientName}
                </div>
                <div class="info-item">
                  <span class="info-label">File:</span> ${fileName}
                </div>
              </div>
              
              <div class="attachment-info">
                <h3 style="margin-top: 0; color: #2e7d32;">🎵 Your Song is Attached!</h3>
                <p>Download your custom song using the button below or find it in your email attachments.</p>
                <a href="${mp3FileUrl}" class="download-btn" download="${fileName}">
                  📥 Download Your Song
                </a>
              </div>
              
              <p>We hope you and ${recipientName} love the song! If you have any questions or need any revisions, please don't hesitate to reach out to us.</p>
              
              <p>Thank you for choosing Muzimake for your custom song needs!</p>
            </div>
            
            <div class="footer">
              <p><strong>Muzimake Team</strong></p>
              <div class="social-links">
                <a href="https://muzimake.com">Website</a>
                <a href="mailto:support@muzimake.com">Support</a>
              </div>
              <p>This email was sent because you ordered a custom song from Muzimake.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: fileName,
          content: fileBase64,
          type: 'audio/mpeg'
        }
      ]
    };

    // Send email via Maileroo API
    const response = await fetch(`${MAILEROO_BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILEROO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Maileroo error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: errorData.message || 'Unknown error'
      });
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    
    return res.status(200).json({ 
      success: true, 
      messageId: result.id || result.messageId,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
