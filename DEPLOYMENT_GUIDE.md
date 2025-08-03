# Stella WhatsApp Integration - Production Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- [Railway CLI](https://docs.railway.app/cli) installed: `npm i -g @railway/cli`
- GitHub repository with your code
- Railway account connected to GitHub

### 1. Frontend + Backend Deployment

```bash
# Deploy both frontend and backend
railway login
railway link
railway up

# Or connect GitHub repository for automatic deployments
# Go to railway.app → New Project → Deploy from GitHub → Select Repository
```

### 2. Environment Variables Setup

In Railway Dashboard → Project → Variables:

```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Database (Railway provides this automatically)
DATABASE_URL=postgresql://username:password@hostname:5432/database

# Security
JWT_SECRET=your_super_secure_jwt_secret_min_32_chars
ALLOWED_ORIGINS=https://your-domain.railway.app

# API Configuration
VITE_API_URL=https://your-project.railway.app/api
NODE_ENV=production
```

### 3. Database Setup

#### Option A: Railway Postgres (Recommended)
```bash
# Add Railway Postgres to your project
railway add postgresql

# Get connection string automatically
railway variables
```

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy database URL from Settings → Database
4. Add to Railway environment variables

#### Option C: PlanetScale
```bash
# Install PlanetScale CLI
npm install -g @planetscale/cli

# Create database
pscale database create stella-whatsapp

# Get connection string
pscale connect stella-whatsapp main
```

### 4. Initialize Database

```bash
# Run database initialization
railway run npm run dev
# Then visit: http://localhost:3000/api/init-db
```

### 5. WhatsApp Business API Setup

#### Step 1: Create Meta Business Account
1. Go to [business.facebook.com](https://business.facebook.com)
2. Create business account and verify

#### Step 2: Create WhatsApp Business App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create App → Business → WhatsApp Business Platform
3. Add WhatsApp product to your app

#### Step 3: Configure Webhook
```bash
# Your webhook URL will be:
https://your-project.railway.app/api/webhook/whatsapp

# Verify token: Use your WHATSAPP_VERIFY_TOKEN
# Subscribe to: messages, message_deliveries, message_reads
```

#### Step 4: Get API Credentials
```bash
# From WhatsApp Business Platform:
# 1. Phone Number ID
# 2. Access Token (temporary - get permanent one)
# 3. Business Account ID
```

### 6. Domain Setup (Optional)

#### Custom Domain
```bash
# Add custom domain in Railway Dashboard
# Update ALLOWED_ORIGINS environment variable
# Update VITE_API_URL if needed
```

## 🔧 Alternative Deployment Options

### Option 1: Netlify (Frontend) + Railway (Backend)

#### Frontend to Netlify:
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: VITE_API_URL
```

#### Backend to Railway:
```bash
# Connect GitHub repository
# Set environment variables
# Deploy with auto-scaling
```

### Option 2: AWS Amplify + Lambda

#### Frontend to AWS Amplify:
```bash
amplify init
amplify add hosting
amplify publish
```

#### Backend to AWS Lambda:
```bash
# Use Serverless Framework
npm install -g serverless
serverless create --template aws-nodejs-typescript
serverless deploy
```

### Option 3: Digital Ocean App Platform

```yaml
# .do/app.yaml
name: stella-whatsapp
services:
- name: web
  source_dir: /
  github:
    repo: your-username/stella-whatsapp
    branch: main
  run_command: npm run preview
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: VITE_API_URL
    value: ${APP_URL}/api
```

## 📊 Production Monitoring

### 1. Error Tracking with Sentry

```bash
# Install Sentry
npm install @sentry/react @sentry/node

# Add to environment variables
SENTRY_DSN=your_sentry_dsn
```

```typescript
// src/utils/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV,
});
```

### 2. Analytics with Google Analytics

```bash
# Install GA4
npm install gtag

# Add tracking ID to environment
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Uptime Monitoring

- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring with alerts
- **StatusPage**: Public status page for users

## 🔒 Security Checklist

### Environment Security
- [ ] All API keys in environment variables (not in code)
- [ ] JWT secret is strong (32+ characters)
- [ ] Database connections use SSL
- [ ] CORS properly configured
- [ ] Rate limiting enabled

### API Security
- [ ] Input validation on all endpoints
- [ ] Authentication middleware on protected routes
- [ ] SQL injection prevention
- [ ] HTTPS enforced
- [ ] Error messages don't expose sensitive data

### WhatsApp Security
- [ ] Webhook verify token is secure
- [ ] Access tokens rotated regularly
- [ ] Message content validated
- [ ] Phone numbers validated
- [ ] Spam protection implemented

## 🚦 Go-Live Checklist

### Pre-Launch
- [ ] Environment variables configured
- [ ] Database initialized and tested
- [ ] WhatsApp webhook verified
- [ ] Test message sending/receiving
- [ ] Error handling tested
- [ ] Load testing completed
- [ ] Backup strategy in place

### Launch Day
- [ ] DNS configured (if custom domain)
- [ ] SSL certificate active
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Support channels ready

### Post-Launch
- [ ] Monitor error rates
- [ ] Check webhook delivery
- [ ] Verify message delivery
- [ ] Monitor database performance
- [ ] Collect user feedback
- [ ] Plan next iteration

## 🆘 Troubleshooting

### Common Issues

#### Webhook Not Receiving Messages
```bash
# Check webhook URL is accessible
curl https://your-domain.railway.app/api/webhook/whatsapp

# Verify webhook subscription in Meta Dashboard
# Check verify token matches environment variable
```

#### Database Connection Issues
```bash
# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, result) => { console.log(err || result.rows[0]); pool.end(); });"
```

#### Authentication Issues
```bash
# Verify JWT secret length (minimum 32 characters)
# Check token expiration settings
# Validate CORS configuration
```

### Support Resources
- **Railway Support**: [railway.app/help](https://railway.app/help)
- **WhatsApp Business API**: [developers.facebook.com/support](https://developers.facebook.com/support)
- **Meta Business Support**: [business.facebook.com/support](https://business.facebook.com/support)

---

## 🎯 Success Metrics

Track these metrics post-deployment:
- Message delivery rate (>95%)
- API response time (<500ms)
- Error rate (<1%)
- User registration conversion
- WhatsApp connection success rate

---

*Keep this guide updated as you deploy and learn what works best for your specific setup.*
