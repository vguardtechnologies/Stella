#!/bin/bash
# Facebook/Instagram Webhook Setup Script
# This script helps you configure live webhooks for the Social Media Commenter

set -e

echo "🔗 Facebook/Instagram Webhook Setup for Stella Social Media Commenter"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found! Please create one first.${NC}"
    exit 1
fi

# Get current ngrok domain
CURRENT_NGROK=$(grep "VITE_WHATSAPP_WEBHOOK_DOMAIN" .env | cut -d'=' -f2)
echo -e "${BLUE}📡 Current ngrok domain: ${CURRENT_NGROK}${NC}"

# Set Facebook webhook verify token
FACEBOOK_VERIFY_TOKEN="stella_facebook_webhook_verify_$(date +%s)"

echo -e "${YELLOW}🔧 Setting up Facebook webhook configuration...${NC}"

# Add Facebook webhook configuration to .env
if ! grep -q "FACEBOOK_VERIFY_TOKEN" .env; then
    echo "" >> .env
    echo "# Facebook/Instagram Webhook Configuration" >> .env
    echo "FACEBOOK_VERIFY_TOKEN=${FACEBOOK_VERIFY_TOKEN}" >> .env
    echo "FACEBOOK_WEBHOOK_URL=https://${CURRENT_NGROK}/api/social-commenter?action=webhook" >> .env
    echo "INSTAGRAM_WEBHOOK_URL=https://${CURRENT_NGROK}/api/social-commenter?action=webhook" >> .env
    echo -e "${GREEN}✅ Added Facebook webhook configuration to .env${NC}"
else
    echo -e "${GREEN}✅ Facebook webhook configuration already exists${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Your webhook URLs are ready:${NC}"
echo -e "Facebook:   ${GREEN}https://${CURRENT_NGROK}/api/social-commenter?action=webhook${NC}"
echo -e "Instagram:  ${GREEN}https://${CURRENT_NGROK}/api/social-commenter?action=webhook${NC}"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Go to Facebook Developer Console: https://developers.facebook.com"
echo "2. Select your app (ID: $(grep VITE_FACEBOOK_APP_ID .env | cut -d'=' -f2))"
echo "3. Go to Webhooks section"
echo "4. Add webhook URL: https://${CURRENT_NGROK}/api/social-commenter?action=webhook"
echo "5. Use verify token: ${FACEBOOK_VERIFY_TOKEN}"
echo "6. Subscribe to: comments, feed, mention events"
echo ""

echo -e "${GREEN}🎉 Setup complete! Your webhooks are ready for testing.${NC}"

# Test webhook endpoint
echo -e "${YELLOW}🧪 Testing webhook endpoint...${NC}"
if curl -s "http://localhost:3000/api/social-commenter?hub.mode=subscribe&hub.verify_token=stella_webhook_verify&hub.challenge=test123" > /dev/null; then
    echo -e "${GREEN}✅ Webhook endpoint is responding correctly${NC}"
else
    echo -e "${RED}❌ Webhook endpoint test failed. Make sure your server is running.${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Need help? Check out the setup guide in FACEBOOK_WEBHOOK_SETUP.md${NC}"
