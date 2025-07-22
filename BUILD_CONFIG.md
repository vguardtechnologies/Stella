# Production Build Configuration

## Build Settings for Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: `18.x`

## Environment Variables for Production
Copy these to your Vercel dashboard:

```bash
# Frontend Environment Variables
VITE_API_URL=https://your-project-name.vercel.app/api
VITE_APP_NAME=Stella WhatsApp Integration
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Backend Environment Variables (Serverless Functions)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
DATABASE_URL=postgresql://username:password@hostname:5432/database
JWT_SECRET=your_super_secure_jwt_secret_min_32_characters
ALLOWED_ORIGINS=https://your-project-name.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
NODE_ENV=production
```

## Build Optimization

### Vite Configuration for Production
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['./src/utils/validation.ts', './src/utils/localStorage.ts']
        }
      }
    }
  },
  preview: {
    port: 4173,
    host: true
  }
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest",
    "deploy": "npm run build && vercel --prod"
  }
}
```

## Performance Optimizations

### Code Splitting
- Lazy load components with React.lazy()
- Split vendor chunks for better caching
- Minimize bundle size

### Asset Optimization
- Compress images (WebP format)
- Minimize CSS and JavaScript
- Enable gzip compression

### Caching Strategy
- Static assets cached for 1 year
- API responses cached appropriately
- Service worker for offline functionality

## Security Hardening

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' https://graph.facebook.com https://*.vercel.app;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  script-src 'self';
">
```

### HTTP Headers
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```
