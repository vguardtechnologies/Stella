# Stella WhatsApp API

Serverless backend API for Stella WhatsApp Integration using Vercel and PostgreSQL.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `POSTGRES_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Business API access token
- `WHATSAPP_VERIFY_TOKEN`: Webhook verify token
- `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp phone number ID
- `CORS_ORIGIN`: Frontend URL for CORS

### 3. Database Setup
Initialize database tables:
```bash
npm run db:migrate
```

### 4. Development
Start local development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth?action=register` - User registration
- `POST /api/auth?action=login` - User login

### WhatsApp Management
- `POST /api/whatsapp?action=configure` - Configure WhatsApp settings
- `GET /api/whatsapp?action=status` - Get WhatsApp status
- `POST /api/whatsapp?action=test-connection` - Test WhatsApp connection
- `POST /api/whatsapp?action=send-message` - Send message
- `GET /api/whatsapp?action=messages` - Get messages
- `GET /api/whatsapp?action=conversations` - Get conversations

### Webhooks
- `GET /api/webhook/whatsapp` - Webhook verification
- `POST /api/webhook/whatsapp` - Receive WhatsApp messages

## 🔧 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### WhatsApp Configurations Table
```sql
CREATE TABLE whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  api_key VARCHAR(500),
  phone_number_id VARCHAR(100),
  webhook_url VARCHAR(500),
  verify_token VARCHAR(255),
  business_account_id VARCHAR(255),
  is_active BOOLEAN DEFAULT false,
  auto_reply BOOLEAN DEFAULT true,
  auto_reply_message TEXT,
  welcome_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),
  last_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(255),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  message_text TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  status VARCHAR(50) DEFAULT 'sent',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📝 API Usage Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth?action=register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth?action=login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Configure WhatsApp
```bash
curl -X POST http://localhost:3000/api/whatsapp?action=configure \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumberId": "your_phone_number_id",
    "accessToken": "your_access_token",
    "webhookUrl": "https://your-domain.com/api/webhook/whatsapp",
    "verifyToken": "your_verify_token",
    "businessAccountId": "your_business_account_id",
    "autoReply": true,
    "autoReplyMessage": "Thank you for contacting us!",
    "welcomeMessage": "Welcome to our service!"
  }'
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/whatsapp?action=send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from Stella!"
  }'
```

## 🚀 Deployment

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Set environment variables: `vercel env add`
3. Deploy: `vercel --prod`

### Environment Variables for Production
Set these in Vercel dashboard or CLI:
```bash
vercel env add POSTGRES_URL
vercel env add JWT_SECRET
vercel env add WHATSAPP_ACCESS_TOKEN
vercel env add WHATSAPP_VERIFY_TOKEN
vercel env add WHATSAPP_PHONE_NUMBER_ID
vercel env add CORS_ORIGIN
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- CORS protection
- Environment variable protection
- SQL injection prevention

## 📊 Database Providers

This API works with:
- **Vercel Postgres** (Recommended for Vercel deployment)
- **Supabase** (PostgreSQL with built-in auth)
- **Railway** (PostgreSQL hosting)
- **AWS RDS** (PostgreSQL)
- **Google Cloud SQL** (PostgreSQL)

## 🐛 Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Error Type",
  "message": "Human readable message",
  "details": [...] // Optional validation details
}
```

## 📞 WhatsApp Setup

1. Create Meta Business Account
2. Create WhatsApp Business API app
3. Get Phone Number ID and Access Token
4. Configure webhook URL: `https://your-domain.com/api/webhook/whatsapp`
5. Set verify token in environment variables

## 🔍 Monitoring

- All endpoints log errors to console
- Database operations are logged
- WhatsApp API calls are logged
- Webhook events are logged

## 🧪 Testing

```bash
# Run tests
npm test

# Test database connection
npm run db:test

# Test WhatsApp API
curl -X POST http://localhost:3000/api/whatsapp?action=test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 Related Documentation

- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [JWT.io](https://jwt.io/)
- [Zod Validation](https://github.com/colinhacks/zod)
