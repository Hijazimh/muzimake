// WhatsApp Webhook endpoint following Meta's official guide
// https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#configure-webhooks

const VERIFY_TOKEN = 'Muzimake_WhatsApp_Verify_2024_Secure_Token_XYZ789';

export default function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // Webhook verification - Meta will call this to verify your endpoint
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('Meta webhook verification request:', { mode, token, challenge });

        // Check if mode and token are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully!');
            res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook verification failed');
            res.status(403).send('Forbidden');
        }
    } else if (req.method === 'POST') {
        // Handle incoming webhook data from Meta
        const body = req.body;

        console.log('📱 Received webhook from Meta:', JSON.stringify(body, null, 2));

        // Process WhatsApp webhook data
        if (body.object === 'whatsapp_business_account') {
            body.entry.forEach(entry => {
                entry.changes.forEach(change => {
                    if (change.field === 'messages') {
                        const messages = change.value.messages;
                        const statuses = change.value.statuses;

                        // Handle incoming messages
                        if (messages) {
                            messages.forEach(message => {
                                console.log('💬 New message received:', message);
                                handleIncomingMessage(message);
                            });
                        }

                        // Handle message status updates
                        if (statuses) {
                            statuses.forEach(status => {
                                console.log('📊 Message status update:', status);
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
    } else {
        res.status(405).send('Method Not Allowed');
    }
}

// Handle incoming messages
function handleIncomingMessage(message) {
    const from = message.from;
    const messageType = message.type;
    const timestamp = message.timestamp;
    
    console.log(`📨 Message from ${from}:`, {
        type: messageType,
        timestamp: new Date(timestamp * 1000).toISOString()
    });

    // Handle different message types
    switch (messageType) {
        case 'text':
            console.log('📝 Text message:', message.text.body);
            break;
        case 'audio':
            console.log('🎵 Audio message received');
            break;
        case 'document':
            console.log('📄 Document message received');
            break;
        case 'image':
            console.log('🖼️ Image message received');
            break;
        default:
            console.log('❓ Other message type:', messageType);
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

    console.log(`📊 Message ${messageId} status: ${statusType}`, {
        recipient: recipientId,
        timestamp: new Date(timestamp * 1000).toISOString()
    });

    // TODO: Update message status in your database
    // - Mark as delivered
    // - Mark as read
    // - Handle failed messages
}