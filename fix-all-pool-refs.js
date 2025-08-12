// Comprehensive fix for all pool references in social-commenter.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'api', 'social-commenter.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Functions that need pool imports
const functionsNeedingPool = [
  'handleAIResponse',
  'handleSendReply', 
  'handleCommentWebhook',
  'handleMarkHandled',
  'handleConnectPlatform',
  'handleDisconnectPlatform'
];

functionsNeedingPool.forEach(functionName => {
  // Pattern to match function definition and add pool import
  const pattern = new RegExp(
    `(async function ${functionName}\\([^)]+\\) \\{[\\s\\S]*?)(try \\{)`,
    'g'
  );
  
  content = content.replace(pattern, (match, beforeTry, tryStatement) => {
    // Only add pool import if it doesn't already exist in this function
    if (!beforeTry.includes("const { pool } = require('../config/database')")) {
      return beforeTry + tryStatement + "\n    const { pool } = require('../config/database');\n";
    }
    return match;
  });
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Comprehensive fix applied to social-commenter.js');
