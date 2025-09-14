// SMTP Email sending endpoint for Muzimake
// This file should be deployed to Vercel as a serverless function

const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, html, audioUrl, customerName, recipientName, celebration, genre, voiceGender } = req.body;

        // Validate required fields
        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create SMTP transporter
        const transporter = nodemailer.createTransporter({
            host: 'smtp.maileroo.com',
            port: 587, // Using port 587 with STARTTLS
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'hello@muzimake.com',
                pass: 'd8a56f16cb3953ec95f8d0e8b8915ad52f8075983645b27f0581a5ed8a9187b0'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Email template
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #fc6900; margin: 0; font-size: 28px;">🎵 Muzimake</h1>
                        <p style="color: #666; margin: 5px 0 0 0;">Custom Songs by Real Artists</p>
                    </div>
                    
                    <h2 style="color: #fc6900; margin-bottom: 20px;">Your Custom Song is Ready! 🎵</h2>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${customerName},</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Great news! Your custom song for <strong>${recipientName}</strong> is complete and ready to enjoy.</p>
                    
                    <div style="background-color: #f3f1eb; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #232321; margin-top: 0; margin-bottom: 15px;">Song Details:</h3>
                        <div style="color: #333; line-height: 1.8;">
                            <p style="margin: 5px 0;"><strong>Recipient:</strong> ${recipientName}</p>
                            <p style="margin: 5px 0;"><strong>Celebration:</strong> ${celebration}</p>
                            <p style="margin: 5px 0;"><strong>Genre:</strong> ${genre}</p>
                            <p style="margin: 5px 0;"><strong>Voice Gender:</strong> ${voiceGender}</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${audioUrl}" 
                           style="background-color: #fc6900; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
                            🎧 Listen to Your Song
                        </a>
                    </div>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">You can also download the audio file directly from the link above.</p>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Thank you for choosing Muzimake for your custom song experience!</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <div style="text-align: center; color: #666; font-size: 12px;">
                        <p style="margin: 5px 0;">This email was sent from Muzimake - Custom Songs by Real Artists</p>
                        <p style="margin: 5px 0;">If you have any questions, please contact our support team.</p>
                    </div>
                </div>
            </div>
        `;

        // Send email
        const info = await transporter.sendMail({
            from: '"Muzimake" <hello@muzimake.com>',
            to: to,
            subject: subject,
            html: emailHtml
        });

        console.log('Email sent successfully:', info.messageId);
        
        return res.status(200).json({ 
            success: true, 
            messageId: info.messageId,
            message: 'Email sent successfully' 
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ 
            error: 'Failed to send email',
            details: error.message 
        });
    }
}
