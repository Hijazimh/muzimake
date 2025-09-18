// Send confirmation email to customer after successful song request submission
// POST /api/send-confirmation-email { customer_name, customer_email, order_id, celebration, recipient_name }

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  try {
    console.log('=== CONFIRMATION EMAIL API START ===');
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request - returning 200');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { customer_name, customer_email, order_id, celebration, recipient_name } = req.body || {};
    
    console.log('Extracted fields:');
    console.log('- customer_name:', customer_name);
    console.log('- customer_email:', customer_email);
    console.log('- order_id:', order_id);
    console.log('- celebration:', celebration);
    console.log('- recipient_name:', recipient_name);
    
    // Validate required fields
    const missing = [];
    if (!customer_name) missing.push('customer_name');
    if (!customer_email) missing.push('customer_email');
    if (!order_id) missing.push('order_id');
    
    if (missing.length) {
      console.log('Missing required fields:', missing);
      return res.status(400).json({ error: 'Missing required fields', missing });
    }

    console.log('All required fields present - proceeding with email setup');

    // Validate SMTP env vars (same as working email API)
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.maileroo.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_USER || !SMTP_PASS) {
      console.error('Missing SMTP credentials. Ensure SMTP_USER and SMTP_PASS are set.');
      return res.status(500).json({ error: 'SMTP not configured', code: 'SMTP_CONFIG_MISSING' });
    }

    // Create SMTP transporter with Maileroo credentials (same as working email API)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // secure for 465
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: false }
    });

    // Before sending, ensure we only send once (idempotent)
    let supabase;
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );
      const { data: existing, error: checkErr } = await supabase
        .from('song_requests')
        .select('id, order_id, welcome_email_sent_at')
        .eq('order_id', order_id)
        .maybeSingle();
      if (!checkErr && existing && existing.welcome_email_sent_at) {
        return res.status(200).json({
          message: 'Confirmation email already sent (skipped).',
          already_sent: true,
          method: 'NOOP'
        });
      }
    } catch (e) {
      console.warn('Supabase check failed (proceeding to send anyway):', e?.message);
    }

    // Email content
    const subject = `🎵 Your Custom Song Request is Confirmed! - Order ${order_id}`;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Song Request Confirmation</title>
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
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo-container {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo-img {
                max-width: 200px;
                height: auto;
                margin-bottom: 10px;
            }
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .light-logo {
                    display: none !important;
                }
                .dark-logo {
                    display: block !important;
                }
                body {
                    background-color: #1a1a1a;
                    color: #ffffff;
                }
                .container {
                    background-color: #2d2d2d;
                    color: #ffffff;
                }
                .order-details {
                    background-color: #3a3a3a;
                }
                .contact-info {
                    background-color: #2a4a6b;
                }
            }
            .greeting {
                font-size: 24px;
                font-weight: 700;
                color: #232321;
                margin-bottom: 20px;
            }
            .order-details {
                background-color: #f3f1eb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .order-id {
                font-weight: 600;
                color: #fc6900;
                font-size: 18px;
            }
            .highlight {
                color: #fc6900;
                font-weight: 600;
            }
            .timeline {
                margin: 30px 0;
            }
            .timeline-item {
                display: flex;
                align-items: center;
                margin: 15px 0;
                padding: 10px 0;
            }
            .timeline-number {
                background-color: #fc6900;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                margin-right: 15px;
                flex-shrink: 0;
            }
            .timeline-text {
                flex: 1;
            }
            .contact-info {
                background-color: #e8f4fd;
                border-left: 4px solid #0056fc;
                padding: 15px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
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
                <div class="logo-container">
                    <img src="https://www.muzimake.com/media/logo-horiz-black.png" 
                         alt="Muzimake" 
                         class="logo-img light-logo"
                         style="max-width: 200px; height: auto;">
                    <img src="https://www.muzimake.com/media/logo-horiz-white.png" 
                         alt="Muzimake" 
                         class="logo-img dark-logo"
                         style="max-width: 200px; height: auto; display: none;">
                </div>
                <div class="greeting">Hello ${customer_name}! 👋</div>
            </div>

            <p>Thank you for choosing <span class="highlight">Muzimake</span> to create a personalized song for your special moment! We're thrilled to be part of making your celebration even more memorable.</p>

            <div class="order-details">
                <h3 style="margin-top: 0; color: #232321;">Your Order Details</h3>
                <p><strong>Order ID:</strong> <span class="order-id">${order_id}</span></p>
                ${celebration ? `<p><strong>Celebration:</strong> ${celebration}</p>` : ''}
                ${recipient_name ? `<p><strong>For:</strong> ${recipient_name}</p>` : ''}
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: 600;">Confirmed & In Production</span></p>
            </div>

            <h3 style="color: #232321;">What Happens Next?</h3>
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-number">1</div>
                    <div class="timeline-text">
                        <strong>Our team reviews your request</strong><br>
                        We carefully read through your story and preferences to understand exactly what you're looking for.
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">2</div>
                    <div class="timeline-text">
                        <strong>We create your custom song</strong><br>
                        Our talented musicians and producers work their magic to bring your vision to life.
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">3</div>
                    <div class="timeline-text">
                        <strong>Quality check & delivery</strong><br>
                        We ensure your song meets our high standards before sending it directly to your email.
                    </div>
                </div>
            </div>

            <div class="contact-info">
                <h4 style="margin-top: 0; color: #0056fc;">⏰ Delivery Timeline</h4>
                <p>We typically deliver your custom song within <strong>6 hours</strong> of your order confirmation. However, if you don't receive your song within this timeframe, please don't hesitate to reach out to us!</p>
            </div>

            <div class="contact-info">
                <h4 style="margin-top: 0; color: #0056fc;">💬 Need Help?</h4>
                <p>If you have any questions or need assistance, you can reach us through the <strong>chat feature on our website</strong> or reply to this email. We're here to help make your experience perfect!</p>
            </div>

            <p>We're genuinely excited to create something special for you. Thank you for trusting us with this important moment in your life.</p>

            <p>Warm regards,<br>
            <strong>The Muzimake Team</strong></p>

            <div class="footer">
                <div class="social-links">
                    <a href="https://www.muzimake.com">Visit Our Website</a>
                    <a href="mailto:support@muzimake.com">Contact Support</a>
                </div>
                <p>This email was sent to ${customer_email} because you placed an order with Muzimake.</p>
                <p>© 2025 Muzimake. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
Hello ${customer_name}!

Thank you for choosing Muzimake to create a personalized song for your special moment! We're thrilled to be part of making your celebration even more memorable.

YOUR ORDER DETAILS:
Order ID: ${order_id}
${celebration ? `Celebration: ${celebration}` : ''}
${recipient_name ? `For: ${recipient_name}` : ''}
Status: Confirmed & In Production

WHAT HAPPENS NEXT?
1. Our team reviews your request - We carefully read through your story and preferences
2. We create your custom song - Our talented musicians and producers work their magic
3. Quality check & delivery - We ensure your song meets our high standards before sending it to your email

DELIVERY TIMELINE:
We typically deliver your custom song within 6 hours of your order confirmation. However, if you don't receive your song within this timeframe, please don't hesitate to reach out to us!

NEED HELP?
If you have any questions or need assistance, you can reach us through the chat feature on our website or reply to this email. We're here to help make your experience perfect!

We're genuinely excited to create something special for you. Thank you for trusting us with this important moment in your life.

Warm regards,
The Muzimake Team

Visit us at: https://www.muzimake.com
Contact Support: support@muzimake.com

This email was sent to ${customer_email} because you placed an order with Muzimake.
© 2025 Muzimake. All rights reserved.
    `;

    const mailOptions = {
      from: SMTP_USER, // must match authenticated user for most providers
      to: customer_email,
      subject: subject,
      html: htmlContent,
    };

    try {
      console.log('Attempting to send confirmation email via SMTP...');
      console.log('To:', customer_email);
      console.log('Subject:', subject);
      console.log('SMTP Config:', {
        host: SMTP_HOST,
        port: SMTP_PORT,
        user: SMTP_USER ? '***@muzimake.com' : 'hello@muzimake.com'
      });
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Confirmation email sent successfully via SMTP', { 
        messageId: info.messageId, 
        accepted: info.accepted, 
        rejected: info.rejected 
      });

      // Mark as sent in DB
      try {
        if (supabase) {
          await supabase
            .from('song_requests')
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq('order_id', order_id);
        }
      } catch (markErr) {
        console.warn('Failed to mark welcome email as sent:', markErr?.message);
      }
      
      res.status(200).json({ 
        message: 'Confirmation email sent successfully',
        method: 'SMTP',
        timestamp: new Date().toISOString(),
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        success: Array.isArray(info.accepted) && info.accepted.length > 0,
        already_sent: false
      });
    } catch (smtpError) {
      console.error('SMTP Error details:', smtpError);
      console.error('SMTP Error message:', smtpError.message);
      console.error('SMTP Error code:', smtpError.code);
      res.status(500).json({ 
        error: 'Failed to send confirmation email via SMTP', 
        details: smtpError.message,
        code: smtpError.code,
        method: 'SMTP'
      });
    }
    
  } catch (apiError) {
    console.error('=== CONFIRMATION EMAIL API ERROR ===');
    console.error('API Error:', apiError);
    console.error('API Error message:', apiError.message);
    console.error('API Error stack:', apiError.stack);
    
    res.status(500).json({ 
      error: 'Internal server error', 
      details: apiError.message,
      method: 'API'
    });
  }
  
  console.log('=== CONFIRMATION EMAIL API END ===');
};
