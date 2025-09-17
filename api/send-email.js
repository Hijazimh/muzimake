const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    try {
        console.log('=== EMAIL API START ===');
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

        const { to, subject, audioUrl } = req.body;
        let { customerName, recipientName, celebration, genre, voiceGender } = req.body;

        console.log('Extracted fields:');
        console.log('- to:', to);
        console.log('- subject:', subject);
        console.log('- audioUrl:', audioUrl);
        console.log('- customerName:', customerName);
        console.log('- recipientName:', recipientName);
        console.log('- celebration:', celebration);
        console.log('- genre:', genre);
        console.log('- voiceGender:', voiceGender);

        // Validate required fields (min set)
        const missing = [];
        if (!to) missing.push('to');
        if (!subject) missing.push('subject');
        if (!audioUrl) missing.push('audioUrl');
        if (missing.length) {
            console.log('Missing required fields:', missing);
            return res.status(400).json({ error: 'Missing required fields', missing });
        }

        // Optional fields fallbacks
        customerName = customerName || 'Customer';
        recipientName = recipientName || 'Recipient';
        celebration = celebration || 'N/A';
        genre = genre || 'N/A';
        voiceGender = voiceGender || 'N/A';
        
        console.log('All required fields present - proceeding with email setup');

    // Validate SMTP env vars
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.maileroo.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_USER || !SMTP_PASS) {
        console.error('Missing SMTP credentials. Ensure SMTP_USER and SMTP_PASS are set.');
        return res.status(500).json({ error: 'SMTP not configured', code: 'SMTP_CONFIG_MISSING' });
    }

    // Create SMTP transporter with Maileroo credentials - using environment variables
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // secure for 465
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        tls: { rejectUnauthorized: false }
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
        from: SMTP_USER, // must match authenticated user for most providers
        to,
        subject,
        html: emailHtml,
    };

        try {
            console.log('Attempting to send email via SMTP...');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('SMTP Config:', {
                host: process.env.SMTP_HOST || 'smtp.maileroo.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                user: process.env.SMTP_USER ? '***@muzimake.com' : 'hello@muzimake.com'
            });
            
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully via SMTP', { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected });
            
            res.status(200).json({ 
                message: 'Email sent successfully',
                method: 'SMTP',
                timestamp: new Date().toISOString(),
                accepted: info.accepted || [],
                rejected: info.rejected || [],
                success: Array.isArray(info.accepted) && info.accepted.length > 0
            });
        } catch (smtpError) {
            console.error('SMTP Error details:', smtpError);
            console.error('SMTP Error message:', smtpError.message);
            console.error('SMTP Error code:', smtpError.code);
            res.status(500).json({ 
                error: 'Failed to send email via SMTP', 
                details: smtpError.message,
                code: smtpError.code,
                method: 'SMTP'
            });
        }
        
    } catch (apiError) {
        console.error('=== EMAIL API ERROR ===');
        console.error('API Error:', apiError);
        console.error('API Error message:', apiError.message);
        console.error('API Error stack:', apiError.stack);
        
        res.status(500).json({ 
            error: 'Internal server error', 
            details: apiError.message,
            method: 'API'
        });
    }
    
    console.log('=== EMAIL API END ===');
};