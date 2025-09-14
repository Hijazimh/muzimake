const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { to, subject, audioUrl, customerName, recipientName, celebration, genre, voiceGender } = req.body;

    // Validate required fields
    if (!to || !subject || !audioUrl || !customerName || !recipientName || !celebration || !genre || !voiceGender) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create SMTP transporter with Maileroo credentials
    const transporter = nodemailer.createTransporter({
        host: 'smtp.maileroo.com',
        port: 587, // Using port 587 with STARTTLS
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'hello@muzimake.com',
            pass: 'ef848dc8124c46364511bed9'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Email template
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #fc6900; text-align: center; margin-bottom: 20px;">Your Custom Song is Ready! 🎵</h2>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${customerName},</p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">Great news! Your custom song for ${recipientName} is complete and ready to enjoy.</p>

                <div style="background-color: #f3f1eb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #232321; margin-top: 0; font-size: 18px;">Song Details:</h3>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Recipient:</strong> ${recipientName}</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Celebration:</strong> ${celebration}</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Genre:</strong> ${genre}</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Voice Gender:</strong> ${voiceGender}</p>
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
                <p style="color: #666; font-size: 12px; text-align: center;">
                    This email was sent from Muzimake - Custom Songs by Real Artists<br>
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: 'hello@muzimake.com',
        to,
        subject,
        html: emailHtml,
    };

    try {
        console.log('Attempting to send email via SMTP...');
        console.log('To:', to);
        console.log('Subject:', subject);
        
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully via SMTP');
        
        res.status(200).json({ 
            message: 'Email sent successfully',
            method: 'SMTP',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error sending email via SMTP:', error);
        res.status(500).json({ 
            error: 'Failed to send email', 
            details: error.message,
            method: 'SMTP'
        });
    }
};