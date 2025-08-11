# Facebook Real-time Webhooks Setup Guide 🔔

## 🎯 Overview
This guide sets up Facebook webhooks for real-time comments and messages, enabling instant AI responses and live comment management in Stella.

## 🏗️ Architecture

```
Facebook/Instagram → Webhook → Stella API → Database → AI Response → Platform Reply
```

### Components Created:
- **`api/facebook-webhook.js`** - Main webhook handler
- **`setup-facebook-webhooks.js`** - Automated configuration script
- **Database integration** - Real-time comment storage
- **AI auto-reply system** - Intelligent response generation

## 🔧 Setup Process

### 1. Local Testing (Development)
```bash
# Test webhook endpoint locally
curl "http://localhost:3000/api/webhook/facebook?hub.mode=subscribe&hub.verify_token=stella_webhook_2025&hub.challenge=test123"

# Should return: test123
```

### 2. Railway Deployment
The webhook is automatically deployed with your app. Your webhook URL will be:
```
https://stella-api.up.railway.app/api/webhook/facebook
```

### 3. Facebook Developer Configuration

#### Option A: Automatic Setup (Recommended)
```bash
# Run the automated setup script
node setup-facebook-webhooks.js

# Or manually specify mode
node setup-facebook-webhooks.js auto
```

#### Option B: Manual Configuration
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Select your app (ID: `1321204592440998`)
3. Navigate to **Webhooks** → **Page**
4. Configure:
   - **Callback URL**: `https://stella-api.up.railway.app/api/webhook/facebook`
   - **Verify Token**: `stella_webhook_2025`
   - **Subscription Fields**:
     - ✅ `feed` (for post comments)
     - ✅ `conversations` (for page messages)
     - ✅ `messages` (for direct messages)

5. For Instagram (if available):
   - Add **Instagram** object
   - Subscribe to: `comments`, `mentions`
   - Same callback URL and verify token

## 📋 Environment Variables

Add these to Railway environment:
```bash
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_WEBHOOK_VERIFY_TOKEN=stella_webhook_2025
APP_URL=https://stella-api.up.railway.app
```

## 🎮 How It Works

### Real-time Comment Flow:
1. **User comments** on Facebook/Instagram post
2. **Facebook sends webhook** to Stella
3. **Stella processes** comment and stores in database
4. **AI generates response** (if auto-reply enabled)
5. **Reply sent back** to Facebook/Instagram
6. **Comment appears** in Social Media Commenter dashboard

### Supported Events:
- **Facebook Comments**: Post comments and replies
- **Instagram Comments**: Photo/video comments
- **Instagram Mentions**: Story/post mentions
- **Direct Messages**: Page messages (future feature)
- **Post Events**: New posts for context

## 🤖 AI Auto-Reply Configuration

### Enable Auto-Reply:
1. Open **Social Media Commenter**
2. Go to **AI Config** tab
3. Enable **Auto Reply**
4. Set **Response Delay** (recommended: 30-60 seconds)
5. Customize **Personality Prompt**

### AI Response Examples:
- **Questions**: "Thanks for your question! We'll get back to you soon."
- **Help requests**: "We're here to help! Please let us know how we can assist."
- **General comments**: "Thank you for your feedback! We appreciate your engagement."

## 🧪 Testing the Setup

### 1. Webhook Verification Test:
```bash
node setup-facebook-webhooks.js test
```

### 2. Live Comment Test:
1. Post a comment on your Facebook page
2. Check server logs for webhook notification
3. Verify comment appears in Social Media Commenter
4. Test AI auto-reply if enabled

### 3. Manual Webhook Test:
```bash
curl -X POST http://localhost:3000/api/webhook/facebook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "page_id",
      "changes": [{
        "field": "feed",
        "value": {
          "item": "comment",
          "comment_id": "123_456",
          "message": "Test comment",
          "from": {"name": "Test User", "id": "user123"},
          "post_id": "post123",
          "created_time": 1234567890
        }
      }]
    }]
  }'
```

## 🔒 Security Features

### Webhook Signature Verification:
- Uses `X-Hub-Signature-256` header
- Verifies with Facebook App Secret
- Prevents unauthorized webhook calls

### Rate Limiting (Future):
- Comment processing limits
- Anti-spam protection
- Duplicate comment detection

## 📊 Database Schema

### Comments Table:
```sql
social_comments (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER,
  external_id VARCHAR(255),
  parent_id VARCHAR(255),
  post_id VARCHAR(255), 
  author_name VARCHAR(255),
  author_id VARCHAR(255),
  message TEXT,
  status VARCHAR(50),
  ai_response TEXT,
  created_at TIMESTAMP,
  responded_at TIMESTAMP
)
```

## 🚀 Production Deployment

### Railway Environment Setup:
1. Go to Railway dashboard
2. Select Stella project
3. Add environment variables:
   ```
   FACEBOOK_APP_SECRET=your_app_secret
   FACEBOOK_WEBHOOK_VERIFY_TOKEN=stella_webhook_2025
   ```

### Facebook App Configuration:
1. Update webhook URL to production domain
2. Test webhook verification
3. Subscribe to required fields
4. Enable webhook for all connected pages

## 📈 Monitoring & Analytics

### Webhook Logs:
- Real-time webhook notifications in server logs
- Comment processing status
- AI response generation logs
- Error tracking and handling

### Social Media Commenter Dashboard:
- Live comment feed
- Response analytics
- Platform connection status
- AI configuration management

## 🔮 Future Enhancements

### Planned Features:
- **Advanced AI Training**: Custom brand voice
- **Sentiment Analysis**: Automatic comment categorization
- **Multi-language Support**: International responses
- **Advanced Filtering**: Spam and inappropriate content detection
- **Analytics Dashboard**: Comment engagement metrics
- **Webhook Retries**: Reliable message delivery

### Integration Possibilities:
- **Customer Support**: Route complex queries to support team
- **E-commerce**: Product recommendations in comments
- **Lead Generation**: Capture potential customers from comments
- **Social Listening**: Brand mention monitoring

## ✅ Verification Checklist

- [ ] Webhook endpoint responding (returns challenge)
- [ ] Facebook Developer app configured
- [ ] Environment variables set in Railway
- [ ] Database tables created
- [ ] Social commenter platforms connected
- [ ] AI configuration enabled
- [ ] Test comment processed successfully
- [ ] Auto-reply working (if enabled)
- [ ] Real-time comment notifications active

## 🎉 Success Indicators

When setup is complete, you should see:
1. ✅ **Server logs**: "Facebook Webhook routes loaded"
2. ✅ **Test comment**: Appears in Social Media Commenter
3. ✅ **AI response**: Generated and sent (if enabled)
4. ✅ **Database**: Comments stored with proper status
5. ✅ **Real-time**: Instant notification processing

Your Facebook integration now supports **real-time comments and messages** with **AI-powered responses**! 🚀
