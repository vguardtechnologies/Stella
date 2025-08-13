#!/bin/bash
# Test Facebook/Instagram Webhooks for Social Media Commenter

echo "🧪 Testing Social Media Commenter Webhooks"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get webhook URL from .env
WEBHOOK_URL=$(grep "FACEBOOK_WEBHOOK_URL" .env | cut -d'=' -f2)
VERIFY_TOKEN=$(grep "FACEBOOK_VERIFY_TOKEN" .env | cut -d'=' -f2)

echo -e "${BLUE}📡 Testing webhook URL: ${WEBHOOK_URL}${NC}"
echo -e "${BLUE}🔑 Using verify token: ${VERIFY_TOKEN}${NC}"
echo ""

# Test 1: Webhook verification
echo -e "${BLUE}Test 1: Webhook Verification${NC}"
VERIFY_URL="${WEBHOOK_URL}&hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test12345"
VERIFY_RESPONSE=$(curl -s "$VERIFY_URL")

if [[ "$VERIFY_RESPONSE" == "test12345" ]]; then
    echo -e "${GREEN}✅ Webhook verification PASSED${NC}"
else
    echo -e "${RED}❌ Webhook verification FAILED${NC}"
    echo "Response: $VERIFY_RESPONSE"
fi

echo ""

# Test 2: Facebook comment webhook
echo -e "${BLUE}Test 2: Facebook Comment Webhook${NC}"
FB_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "changes": [{
        "field": "feed",
        "value": {
          "item": "comment",
          "comment_id": "live_test_fb_'$(date +%s)'",
          "post_id": "live_test_post_'$(date +%s)'",
          "message": "Live webhook test from script! 🚀",
          "from": {
            "id": "test_user_'$(date +%s)'",
            "name": "Live Test User"
          },
          "created_time": "'$(date -u +%Y-%m-%dT%H:%M:%S)+0000'"
        }
      }]
    }]
  }')

if [[ "$FB_RESPONSE" == *"success"* ]]; then
    echo -e "${GREEN}✅ Facebook webhook test PASSED${NC}"
else
    echo -e "${RED}❌ Facebook webhook test FAILED${NC}"
    echo "Response: $FB_RESPONSE"
fi

echo ""

# Test 3: Instagram comment webhook  
echo -e "${BLUE}Test 3: Instagram Comment Webhook${NC}"
IG_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram", 
    "entry": [{
      "id": "17841400008460056",
      "time": '$(date +%s)',
      "changes": [{
        "value": {
          "id": "ig_live_test_'$(date +%s)'",
          "media_id": "17841400008460055",
          "text": "Live Instagram webhook test! 📸",
          "from": {
            "id": "17841400008460001",
            "username": "livetestuser'$(date +%s)'"
          },
          "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S)Z'"
        },
        "field": "comments"
      }]
    }]
  }')

if [[ "$IG_RESPONSE" == *"success"* ]]; then
    echo -e "${GREEN}✅ Instagram webhook test PASSED${NC}"
else
    echo -e "${RED}❌ Instagram webhook test FAILED${NC}"
    echo "Response: $IG_RESPONSE"
fi

echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "1. If all tests passed, configure Facebook Developer Console"
echo "2. Use webhook URL: $WEBHOOK_URL"  
echo "3. Use verify token: $VERIFY_TOKEN"
echo "4. Check your Social Media Commenter frontend for live comments"
echo ""
echo -e "${GREEN}🎉 Webhook testing complete!${NC}"
