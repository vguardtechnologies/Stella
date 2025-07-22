const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    platform: 'Railway',
    message: 'Stella API is running successfully on Railway!'
  });
});

// Import API handlers (we'll create these)
const authHandler = require('./api/auth/index.js');
const whatsappHandler = require('./api/whatsapp/index.js');
const webhookHandler = require('./api/webhook/whatsapp.js');

// API Endpoints
app.use('/api/auth', authHandler);
app.use('/api/whatsapp', whatsappHandler);
app.use('/api/webhook', webhookHandler);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Stella app running on Railway at port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
