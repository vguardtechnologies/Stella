#!/bin/bash

# Facebook Integration Test Script for Stella
# This script tests the Facebook API endpoints

echo "🧪 Testing Facebook Integration for Stella"
echo "=========================================="

BASE_URL="http://localhost:3000"

echo ""
echo "1. Testing Backend Health Check..."
curl -s "$BASE_URL/api/health" | jq '.status' || echo "❌ Backend not responding"

echo ""
echo "2. Testing Facebook Auth URL Generation..."
AUTH_RESPONSE=$(curl -s "$BASE_URL/api/facebook?action=auth-url")
if echo "$AUTH_RESPONSE" | jq -e '.authUrl' > /dev/null; then
    echo "✅ Auth URL generated successfully"
    echo "🔗 Auth URL: $(echo "$AUTH_RESPONSE" | jq -r '.authUrl')"
else
    echo "❌ Failed to generate auth URL"
    echo "Response: $AUTH_RESPONSE"
fi

echo ""
echo "3. Testing Facebook User Info Endpoint (without token)..."
USER_RESPONSE=$(curl -s "$BASE_URL/api/facebook?action=user-info")
if echo "$USER_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "✅ User info endpoint correctly requires access token"
else
    echo "❌ User info endpoint should require access token"
fi

echo ""
echo "4. Testing Facebook Pages Endpoint (without token)..."
PAGES_RESPONSE=$(curl -s "$BASE_URL/api/facebook?action=pages")
if echo "$PAGES_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "✅ Pages endpoint correctly requires access token"
else
    echo "❌ Pages endpoint should require access token"
fi

echo ""
echo "5. Testing Facebook Instagram Endpoint (without token)..."
INSTAGRAM_RESPONSE=$(curl -s "$BASE_URL/api/facebook?action=instagram")
if echo "$INSTAGRAM_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "✅ Instagram endpoint correctly requires access token"
else
    echo "❌ Instagram endpoint should require access token"
fi

echo ""
echo "6. Checking Frontend Assets..."
if [ -f "public/auth/facebook/callback.html" ]; then
    echo "✅ Facebook OAuth callback page exists"
else
    echo "❌ Facebook OAuth callback page missing"
fi

if [ -f "src/components/MetaIntegrationPage.tsx" ]; then
    echo "✅ Meta Integration Page component exists"
else
    echo "❌ Meta Integration Page component missing"
fi

if [ -f "src/components/MediaBrowser.tsx" ]; then
    echo "✅ Media Browser component exists"
else
    echo "❌ Media Browser component missing"
fi

if [ -f "src/api/facebook.ts" ]; then
    echo "✅ Facebook API client exists"
else
    echo "❌ Facebook API client missing"
fi

echo ""
echo "7. Checking Environment Configuration..."
if grep -q "VITE_FACEBOOK_APP_ID" .env; then
    echo "✅ Facebook App ID configured in .env"
else
    echo "⚠️ Facebook App ID not configured in .env"
fi

if grep -q "VITE_PRIVACY_MODE" .env; then
    echo "✅ Privacy mode configured in .env"
else
    echo "⚠️ Privacy mode not configured in .env"
fi

echo ""
echo "8. Testing Frontend Server..."
if curl -s "http://localhost:5173" > /dev/null; then
    echo "✅ Frontend server is running on port 5173"
else
    echo "❌ Frontend server not accessible on port 5173"
fi

echo ""
echo "==========================================="
echo "🎯 Facebook Integration Test Complete"
echo ""
echo "📋 Manual Testing Steps:"
echo "1. Open http://localhost:5173 in browser"
echo "2. Click Facebook Integration button in ActionBar"
echo "3. Test connection flow in MetaIntegrationPage"
echo "4. Open ChatPage and test Media attachment option"
echo "5. Verify MediaBrowser opens and shows connection interface"
echo ""
echo "🔧 To complete integration:"
echo "1. Set up Facebook Developer App"
echo "2. Configure redirect URI: http://localhost:5173/auth/facebook/callback"
echo "3. Add real Facebook App ID to .env file"
echo "4. Test with real Facebook account"
echo ""
