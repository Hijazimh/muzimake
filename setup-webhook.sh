#!/bin/bash

echo "🚀 Setting up WhatsApp Webhook Server for Muzimake"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "⚠️  ngrok is not installed. Installing ngrok..."
    
    # Detect OS and install ngrok
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "Please install ngrok manually: https://ngrok.com/download"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    else
        echo "Please install ngrok manually: https://ngrok.com/download"
    fi
else
    echo "✅ ngrok is installed: $(ngrok version)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the webhook server:"
echo "   npm start"
echo ""
echo "2. In another terminal, start ngrok:"
echo "   ngrok http 3000"
echo ""
echo "3. Copy the ngrok URL (e.g., https://abc123.ngrok.io)"
echo ""
echo "4. In Meta Developer Console, configure webhook:"
echo "   Callback URL: https://abc123.ngrok.io/webhook"
echo "   Verify Token: Muzimake_WhatsApp_Verify_2024_Secure_Token_XYZ789"
echo ""
echo "5. Subscribe to webhook fields:"
echo "   - messages"
echo "   - message_deliveries"
echo "   - message_reads"
echo ""
echo "🔧 Your webhook server will be available at:"
echo "   http://localhost:3000/webhook"
echo ""
echo "🧪 Test webhook verification:"
echo "   curl \"http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=Muzimake_WhatsApp_Verify_2024_Secure_Token_XYZ789&hub.challenge=test123\""
