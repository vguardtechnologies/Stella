#!/bin/bash
echo "🔄 Restarting Stella server..."

# Kill existing server
pkill -f "node server.js" 2>/dev/null || true

# Wait a moment
sleep 2

# Start server
echo "🚀 Starting server..."
node server.js
