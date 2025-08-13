# 🔗 Facebook/Instagram Live Webhook Setup Guide

## 🎯 Overview
This guide will help you set up live webhook URLs for your Social Media Commenter to receive real Facebook and Instagram comments in real-time.

## ✅ Prerequisites Checklist
- [x] Stella backend server running (`npm start`)
- [x] Ngrok tunnel active (domain: `9b82ac6c2aa6.ngrok-free.app`)
- [x] Facebook App created (ID: `1321204592440998`)
- [x] Facebook access token configured
- [x] Social Media Commenter API working

## 🚀 Step-by-Step Setup

### 1. Run the Setup Script
```bash
chmod +x setup-facebook-webhooks-live.sh
./setup-facebook-webhooks-live.sh
```

### 2. Facebook Developer Console Setup

#### A. Access Facebook Developer Console
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Log in with your Facebook account
3. Select your app: **App ID 1321204592440998**

#### B. Configure Webhooks
1. In the left sidebar, click **Webhooks**
2. Click **Add Subscription** for **Page** subscriptions
3. Enter your webhook details:
   - **Callback URL**: `https://9b82ac6c2aa6.ngrok-free.app/api/social-commenter?action=webhook`
   - **Verify Token**: `stella_webhook_verify` (or the new token from setup script)
   - **Subscription Fields**: Select:
     - ✅ `feed` (for post comments)
     - ✅ `comments` (for comment events)
     - ✅ `mention` (for mentions)

#### C. Instagram Setup (if needed)
1. In the same app, go to **Products** → **Instagram**
2. Add Instagram product if not already added
3. Configure Instagram webhooks:
   - **Callback URL**: Same as above
   - **Verify Token**: Same as above
   - **Subscription Fields**: Select:
     - ✅ `comments`
     - ✅ `mentions`

### 3. Test Your Webhook

#### A. Webhook Verification Test
Your webhook should automatically pass Facebook's verification. Check the console logs:
```
✅ Facebook webhook verified!
```

#### B. Live Comment Test
1. Make a post on your connected Facebook page
2. Add a comment to that post
3. Check your Stella console logs for:
```
🔔 Incoming webhook data: {...}
📘 Processing Facebook webhook...
💾 Saving comment to database: {...}
✅ Comment saved with ID: XXX
```

### 4. Frontend Testing
1. Open Stella in your browser: `http://localhost:5173`
2. Click the **Social Media Commenter** button
3. Go to the **Comments** tab
4. You should see your live comments appearing!

## 🔧 Configuration Details

### Current Webhook URLs
- **Facebook**: `https://9b82ac6c2aa6.ngrok-free.app/api/social-commenter?action=webhook`
- **Instagram**: `https://9b82ac6c2aa6.ngrok-free.app/api/social-commenter?action=webhook`

### Verify Token
- **Current**: `stella_webhook_verify`
- **Backup**: Check your `.env` file for `FACEBOOK_VERIFY_TOKEN`

### Supported Platforms
- ✅ **Facebook Pages** - Comments on posts
- ✅ **Instagram Business** - Comments on posts/reels
- 🔄 **TikTok** - Ready for integration
- 🔄 **Facebook Ads** - Ready for integration

## 🧪 Testing Scenarios

### 1. Facebook Comment Test
```bash
# Test webhook manually
curl -X POST "https://9b82ac6c2aa6.ngrok-free.app/api/social-commenter?action=webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "changes": [{
        "field": "feed",
        "value": {
          "item": "comment",
          "comment_id": "test_comment_123",
          "post_id": "test_post_123",
          "message": "Live webhook test comment!",
          "from": {
            "id": "123456789",
            "name": "Test User"
          },
          "created_time": "2025-08-12T12:00:00+0000"
        }
      }]
    }]
  }'
```

### 2. Instagram Comment Test  
```bash
curl -X POST "https://9b82ac6c2aa6.ngrok-free.app/api/social-commenter?action=webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "17841400008460056",
      "time": 1723464000,
      "changes": [{
        "value": {
          "id": "ig_live_test_comment",
          "media_id": "17841400008460055",
          "text": "Live Instagram webhook test!",
          "from": {
            "id": "17841400008460001", 
            "username": "testuser"
          },
          "timestamp": "2025-08-12T12:00:00Z"
        },
        "field": "comments"
      }]
    }]
  }'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Webhook Verification Failed
```
❌ Facebook webhook verification failed
```
**Solution**: Check that your verify token matches in:
- Facebook Developer Console
- Your `.env` file (`FACEBOOK_VERIFY_TOKEN`)
- The webhook handler code

#### 2. ngrok Domain Changed
If ngrok restarts, your domain changes. Update:
1. `.env` file: `VITE_WHATSAPP_WEBHOOK_DOMAIN`
2. Facebook Developer Console webhook URL
3. Run setup script again

#### 3. Comments Not Appearing
**Check Console Logs**:
```bash
# Check if webhooks are being received
tail -f logs/webhook.log

# Check database
psql $DATABASE_URL -c "SELECT * FROM social_comments ORDER BY created_at DESC LIMIT 5;"
```

### Debug Mode
Enable verbose logging in your social-commenter.js:
```javascript
console.log('🔔 Incoming webhook data:', JSON.stringify(req.body, null, 2));
```

## 🎉 Success Indicators

When everything is working, you'll see:

### Console Logs
```
🔔 Incoming webhook data: {...}
📘 Processing Facebook webhook...
💾 Saving comment to database: {...}
✅ Comment saved with ID: 135
🎉 Webhook processed successfully!
```

### Frontend
- Comments appear in real-time in the **Comments** tab
- Proper platform icons (📘 Facebook, 📷 Instagram)
- Author names and comment text displayed correctly
- AI response buttons functional

### Database
```sql
SELECT platform_name, author_name, comment_text, created_at 
FROM social_comments c 
JOIN social_platforms p ON c.platform_id = p.id 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🚀 Next Steps

1. **Set up real Facebook/Instagram pages** for testing
2. **Configure AI responses** for automatic replies
3. **Test bulk operations** for managing multiple comments
4. **Set up monitoring** for webhook health
5. **Deploy to production** with permanent webhook URLs

## 🆘 Need Help?

If you run into issues:
1. Check the console logs in your terminal
2. Verify ngrok is still running: `ngrok status`
3. Test the webhook endpoint manually
4. Check Facebook Developer Console for webhook errors
5. Ensure your Facebook access token is valid

---

**Your Social Media Commenter is ready for real-world testing!** 🎊
