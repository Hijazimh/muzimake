const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your webhook verify token (use the same one in Meta Developer Console)
const VERIFY_TOKEN = 'Muzimake_WhatsApp_Verify_2024_Secure_Token_XYZ789';

// Production webhook URL (update this with your actual Vercel domain)
const PRODUCTION_WEBHOOK_URL = 'https://your-vercel-domain.vercel.app/webhook';

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Webhook verification request:', { mode, token, challenge });

    // Check if mode and token are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        console.log('Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

// Webhook endpoint to receive messages
app.post('/webhook', (req, res) => {
    const body = req.body;

    console.log('Received webhook:', JSON.stringify(body, null, 2));

    // Check if it's a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach(entry => {
            entry.changes.forEach(change => {
                if (change.field === 'messages') {
                    const messages = change.value.messages;
                    const statuses = change.value.statuses;

                    // Handle incoming messages
                    if (messages) {
                        messages.forEach(message => {
                            console.log('Received message:', message);
                            handleIncomingMessage(message);
                        });
                    }

                    // Handle message statuses
                    if (statuses) {
                        statuses.forEach(status => {
                            console.log('Message status update:', status);
                            handleMessageStatus(status);
                        });
                    }
                }
            });
        });

        res.status(200).send('OK');
    } else {
        res.status(404).send('Not Found');
    }
});

// Handle incoming messages
function handleIncomingMessage(message) {
    const from = message.from;
    const messageType = message.type;
    const timestamp = message.timestamp;
    
    console.log(`Message from ${from}:`, {
        type: messageType,
        timestamp: new Date(timestamp * 1000).toISOString()
    });

    // Handle different message types
    switch (messageType) {
        case 'text':
            console.log('Text message:', message.text.body);
            break;
        case 'audio':
            console.log('Audio message received');
            break;
        case 'document':
            console.log('Document message received');
            break;
        case 'image':
            console.log('Image message received');
            break;
        default:
            console.log('Other message type:', messageType);
    }

    // TODO: Add your business logic here
    // - Save message to database
    // - Send auto-reply if needed
    // - Update order status
    // - Notify admin
}

// Handle message status updates
function handleMessageStatus(status) {
    const messageId = status.id;
    const statusType = status.status;
    const timestamp = status.timestamp;
    const recipientId = status.recipient_id;

    console.log(`Message ${messageId} status: ${statusType}`, {
        recipient: recipientId,
        timestamp: new Date(timestamp * 1000).toISOString()
    });

    // TODO: Update message status in your database
    // - Mark as delivered
    // - Mark as read
    // - Handle failed messages
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'WhatsApp Webhook Server'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`WhatsApp webhook server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`Verify Token: ${VERIFY_TOKEN}`);
    console.log('\nTo test webhook verification:');
    console.log(`curl "http://localhost:${PORT}/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123"`);
});

module.exports = app;
