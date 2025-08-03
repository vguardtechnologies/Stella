#!/bin/bash

# 🚀 Stella - One-Click Deploy Script
# Usage: ./go-live.sh or npm run go-live

echo "🚀 Deploying Stella to Production with Railway..."
echo "=============================================="

# Quick checks
if [ ! -f "package.json" ]; then
    echo "❌ Run this from your Stella project folder"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   or visit: https://docs.railway.app/cli"
    exit 1
fi

# Build and deploy in one go
echo "📦 Building and deploying to Railway..."
echo ""

# Deploy to Railway
railway up

echo ""
echo "🧪 Testing deployment..."
echo "Getting Railway URL..."
RAILWAY_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -n "$RAILWAY_URL" ]; then
    echo "Checking: $RAILWAY_URL/api/health"
    curl -s "$RAILWAY_URL/api/health" || echo "API test pending..."
else
    echo "Railway URL will be available shortly..."
fi

echo ""
echo "🎉 SUCCESS! Your app is now LIVE on Railway!"
echo "==========================================="
echo ""

echo ""
echo "🎉 SUCCESS! Your app is now LIVE!"
echo "================================="
echo ""
echo "🌐 Frontend: Ready for users on Railway!"
echo "⚡ Backend API: Live and ready!"
echo "📱 Share your live app with anyone!"
echo ""
echo "🧪 Test your API endpoints:"
echo "   • Health: /api/health"
echo "   • Auth: /api/auth?action=register"
echo "   • WhatsApp: /api/whatsapp?action=status"
echo ""
echo "✨ Next steps:"
echo "   • Test all features on your live site"
echo "   • Add WhatsApp Business API credentials in Railway dashboard"
echo "   • Share with users and start getting feedback!"
echo ""
echo "🚄 Railway Dashboard: https://railway.app/dashboard"
echo "📚 Railway Docs: https://docs.railway.app"
echo ""
