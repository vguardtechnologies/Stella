#!/bin/bash

# 🚀 Stella - One-Click Deploy Script
# Usage: ./go-live.sh or npm run go-live

echo "🚀 Deploying Stella to Production..."
echo "=================================="

# Quick checks
if [ ! -f "package.json" ]; then
    echo "❌ Run this from your Stella project folder"
    exit 1
fi

# Build and deploy in one go
echo "📦 Building frontend and backend..."
echo ""

# Deploy entire app (frontend + API) to Vercel
vercel --prod

echo ""
echo "🧪 Testing backend API..."
echo "Checking: https://stella-nvyb66ka2-ayo-marcelles-projects.vercel.app/api/health"
echo ""

echo ""
echo "🎉 SUCCESS! Your app is now LIVE!"
echo "================================="
echo ""
echo "🌐 Frontend: Ready for users!"
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
echo "   • Add WhatsApp Business API credentials if needed"
echo "   • Share with users and start getting feedback!"
echo ""
