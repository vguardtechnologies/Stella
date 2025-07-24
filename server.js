const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const { createTables } = require('./database/migrations');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'Local',
    message: 'Stella API is running successfully!'
  });
});

// Import and use API handlers - testing one by one
try {
  const authHandler = require('./api/auth/index.js');
  app.use('/api/auth', authHandler);
  console.log('✅ Auth routes loaded');

  const whatsappHandler = require('./api/whatsapp/index.js');
  app.use('/api/whatsapp', whatsappHandler);
  console.log('✅ WhatsApp routes loaded');

  const messagesHandler = require('./api/messages/index.js');
  app.use('/api/messages', messagesHandler);
  console.log('✅ Messages routes loaded');

  const webhookHandler = require('./api/webhook/whatsapp.js');
  app.use('/api/webhook/whatsapp', webhookHandler);
  console.log('✅ Webhook routes loaded');
  
} catch (error) {
  console.log('⚠️ API routes error:', error.message);
}

// Serve React app for all other routes (using express.static fallback)
app.use((req, res, next) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // For all other routes, serve the React app
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`🚀 Stella app running at http://localhost:${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize database tables
  try {
    await createTables();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
});
