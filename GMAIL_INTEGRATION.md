# Gmail Integration Setup Guide

## Overview
The Gmail Integration allows users to connect their Gmail accounts to Stella and manage emails directly within the application.

## Features
- ✅ OAuth 2.0 authentication with Gmail
- ✅ Read and display emails from inbox
- ✅ Email search and filtering
- ✅ Email content viewer with HTML support
- ✅ Responsive design for mobile and desktop
- 🚧 Send replies (UI ready, needs implementation)
- 🚧 Forward emails (UI ready, needs implementation)
- 🚧 Archive emails (UI ready, needs implementation)

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 2. OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:5173/gmail-callback`
   - For production: `https://yourdomain.com/gmail-callback`
5. Copy the Client ID and Client Secret

### 3. Environment Configuration

1. Copy `.env.gmail.example` to `.env`
2. Update the environment variables:
   ```env
   VITE_GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GMAIL_CLIENT_SECRET=your-client-secret
   VITE_GMAIL_REDIRECT_URI=http://localhost:5173/gmail-callback
   ```

### 4. Usage

1. Click the Gmail button (📧) in the activity bar
2. Click "Connect Gmail Account"
3. Complete the OAuth flow in the popup
4. Start managing your emails!

## Security Notes

- Access tokens are stored in localStorage with expiry checking
- Refresh tokens are used to automatically renew access
- All Gmail API calls are made client-side to maintain privacy
- OAuth 2.0 flow ensures secure authentication

## API Scopes Used

- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails (future feature)

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Check that your OAuth credentials are correct
   - Ensure the redirect URI matches exactly

2. **Token Expired**
   - The app automatically handles token refresh
   - If issues persist, disconnect and reconnect

3. **Emails Not Loading**
   - Check network connectivity
   - Verify Gmail API is enabled in Google Cloud Console

### Development Tips

- Use localhost for development redirect URI
- Test with a Gmail account that has emails
- Check browser console for detailed error messages

## File Structure

```
src/components/
├── GmailIntegration.tsx    # Main Gmail component
├── GmailIntegration.css    # Styling for Gmail interface
├── ActionBar.tsx           # Updated with Gmail button
└── ActionBar.css           # Gmail button styling

api/
└── gmail-helpers.js        # Server-side Gmail utilities
```

## Future Enhancements

- [ ] Email composition interface
- [ ] Advanced search and filters
- [ ] Email labels and categories
- [ ] Bulk operations (mark as read, delete, etc.)
- [ ] Email templates
- [ ] Attachment handling
- [ ] Integration with customer management
- [ ] Email analytics and tracking
