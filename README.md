# Stella - React Frontend Application

A modern React frontend application built with TypeScript and Vite, providing a fast development experience with hot module replacement (HMR) and modern tooling.

## 🚀 Features

- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Hot Module Replacement (HMR)** for instant feedback during development
- **ESLint** configuration for code quality
- **Modern JavaScript/TypeScript** features and best practices

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ and npm (or yarn/pnpm)

### Installation & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to view the app

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
src/
├── components/     # Reusable React components
├── assets/         # Static assets (images, icons, etc.)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
├── App.tsx         # Main App component
├── main.tsx        # Application entry point
└── index.css       # Global styles
```


## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

### Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Next-generation frontend build tool
- **ESLint** - Code linting and quality assurance

## 🎨 Customization

The project comes with a clean, minimal setup that you can easily customize:

1. **Styling**: Add your preferred CSS framework (Tailwind, styled-components, etc.)
2. **State Management**: Integrate Redux, Zustand, or other state management solutions
3. **Routing**: Add React Router for multi-page applications
4. **UI Components**: Add component libraries like Material-UI, Chakra UI, etc.

# � Stella WhatsApp Integration - Production Ready

A modern React application with serverless backend for WhatsApp Business API integration.

## ⚡ Quick Deploy

### One-Click Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/stella-whatsapp)

### Manual Deployment
```bash
# 1. Clone and install
git clone https://github.com/your-username/stella-whatsapp.git
cd stella-whatsapp
npm install

# 2. Set up environment variables
cp .env.template .env.local
# Edit .env.local with your values

# 3. Deploy
npm run deploy
```

## 🛠️ Environment Setup

### Required Environment Variables

```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Security
JWT_SECRET=your_32_char_secret
ALLOWED_ORIGINS=https://your-domain.vercel.app
```

See `.env.template` for complete configuration.

## 🏗️ Architecture

```
Stella WhatsApp Integration
├── Frontend (React + TypeScript + Vite)
│   ├── Modern responsive UI
│   ├── Real-time messaging interface
│   └── Dashboard for WhatsApp management
├── Backend (Vercel Serverless Functions)
│   ├── Authentication (JWT)
│   ├── WhatsApp API integration
│   ├── Webhook handling
│   └── Database operations
└── Database (PostgreSQL)
    ├── User management
    ├── Message storage
    ├── Conversation tracking
    └── WhatsApp configurations
```

## 🔧 Features

- ✅ **WhatsApp Business API Integration**
  - Send and receive messages
  - Media message support
  - Message status tracking
  - Automated responses

- ✅ **Modern Frontend**
  - React 18 with TypeScript
  - Responsive design (mobile-first)
  - Accessibility features (WCAG compliant)
  - Real-time message updates

- ✅ **Secure Backend**
  - JWT authentication
  - Input validation
  - Rate limiting
  - CORS protection

- ✅ **Production Ready**
  - Serverless architecture
  - PostgreSQL database
  - Error monitoring
  - Performance optimized

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
