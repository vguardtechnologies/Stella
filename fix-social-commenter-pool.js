// Script to fix pool references in social-commenter.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'api', 'social-commenter.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove the top-level pool import since we're using local imports
content = content.replace(/const { pool } = require\('\.\.\/config\/database'\);\n/g, '');

// Find all function definitions that use pool and add local import
const functionPatterns = [
  'async function handleUpdateAIConfig',
  'async function handleAIResponse',
  'async function handleSendReply',
  'async function handleCommentWebhook',
  'async function handleMarkHandled',
  'async function handleConnectPlatform',
  'async function handleDisconnectPlatform',
  'async function handleGetPlatforms'
];

functionPatterns.forEach(pattern => {
  const regex = new RegExp(`(${pattern}\\(req, res\\) \\{\\s*)(try \\{)`, 'g');
  content = content.replace(regex, `$1$2\n    const { pool } = require('../config/database');\n`);
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed pool references in social-commenter.js');
