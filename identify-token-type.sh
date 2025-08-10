#!/bin/bash

echo "🔍 Facebook vs WhatsApp Token Identifier"
echo "========================================"
echo ""
echo "This will help you identify which type of token you're using."
echo ""

# Function to test WhatsApp token
test_whatsapp_token() {
    local token="$1"
    echo "🔍 Testing as WhatsApp token..."
    
    # Try a WhatsApp API call (this would work with WhatsApp token)
    local response=$(curl -s "https://graph.facebook.com/v18.0/me?access_token=$token" | grep -o '"error"' | wc -l)
    
    if [ "$response" -eq 0 ]; then
        echo "   ⚠️ Token works for basic user info, but may not have page permissions"
    else
        echo "   ❌ Token doesn't work for basic user info"
    fi
}

# Function to test Facebook token
test_facebook_token() {
    local token="$1"
    echo "🔍 Testing as Facebook token..."
    
    # Try Facebook pages API call
    local response=$(curl -s "https://graph.facebook.com/v18.0/me/accounts?access_token=$token" | grep -o '"data"' | wc -l)
    
    if [ "$response" -gt 0 ]; then
        echo "   ✅ Token has Facebook pages access!"
    else
        echo "   ❌ Token doesn't have Facebook pages access"
    fi
}

# Get token from localStorage (user will need to provide this)
echo "📋 How to get your current token:"
echo "================================"
echo ""
echo "1. Open your browser at http://localhost:5173"
echo "2. Press F12 (Developer Tools)"
echo "3. Go to Console tab"
echo "4. Run this command:"
echo "   localStorage.getItem('simpleFacebookConfig')"
echo ""
echo "5. Look for the 'accessToken' field in the result"
echo "6. Copy that token and paste it below"
echo ""

# Prompt for token input
echo "🔑 Paste your access token here and press Enter:"
read -r USER_TOKEN

if [ -z "$USER_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo ""
echo "🧪 Testing your token..."
echo "========================"

# Test both scenarios
test_whatsapp_token "$USER_TOKEN"
test_facebook_token "$USER_TOKEN"

echo ""
echo "🎯 Quick Token Type Check:"
echo "========================="

# Check what the token returns for basic user info
USER_INFO=$(curl -s "https://graph.facebook.com/v18.0/me?access_token=$USER_TOKEN")

if echo "$USER_INFO" | grep -q '"id"'; then
    echo "✅ Token returns user info (good sign)"
    
    # Check for pages
    PAGES_INFO=$(curl -s "https://graph.facebook.com/v18.0/me/accounts?access_token=$USER_TOKEN")
    
    if echo "$PAGES_INFO" | grep -q '"data"'; then
        echo "✅ Token can access Facebook pages - THIS IS CORRECT!"
        echo ""
        echo "🎉 Your token is a valid Facebook token!"
        echo "   If you're still getting errors, the token might have expired."
    else
        echo "❌ Token cannot access Facebook pages"
        echo ""
        echo "🚨 This might be a WhatsApp token or missing permissions!"
        echo ""
        echo "📋 To fix this:"
        echo "1. Go to: https://developers.facebook.com/tools/explorer/"
        echo "2. Select your app"
        echo "3. Get Token → Get User Access Token"
        echo "4. Add permissions: pages_show_list, pages_read_engagement"
        echo "5. Generate Access Token"
        echo "6. Use that new token in your app"
    fi
else
    echo "❌ Token doesn't return basic user info"
    
    if echo "$USER_INFO" | grep -q "Invalid OAuth"; then
        echo "🚨 LIKELY A WHATSAPP TOKEN!"
        echo ""
        echo "WhatsApp tokens don't work with Facebook Graph API."
        echo "You need a separate Facebook token."
    else
        echo "🚨 Token appears to be expired or invalid"
    fi
fi

echo ""
echo "💡 Remember:"
echo "============"
echo "• WhatsApp Token = For sending WhatsApp messages"
echo "• Facebook Token = For browsing Facebook pages/content"
echo "• They're different tokens for different purposes!"
echo ""
echo "📚 Need help? Check: FACEBOOK_TOKEN_FIX.md"
