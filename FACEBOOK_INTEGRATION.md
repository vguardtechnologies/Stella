# Facebook/Instagram Media Integration for Stella

## Overview
This integration allows Stella users to browse and share content from their connected Facebook pages and Instagram business accounts directly through the WhatsApp chat interface.

## Features Implemented

### 1. Facebook API Client (`src/api/facebook.ts`)
- **Authentication**: OAuth2 flow with popup-based login
- **Account Management**: Connect/disconnect Facebook accounts
- **Pages & Instagram**: Fetch connected Facebook pages and Instagram business accounts
- **Media Browsing**: Retrieve posts, photos, videos, and Instagram reels
- **Toggle Management**: Enable/disable integration for specific pages/accounts

### 2. Meta Integration Page (`src/components/MetaIntegrationPage.tsx`)
- **Connection Interface**: User-friendly Facebook login process
- **Account Overview**: Display connected user information and available pages/Instagram accounts
- **Toggle Controls**: Enable/disable specific pages and Instagram accounts for content sharing
- **Status Tracking**: Real-time connection and integration status
- **Responsive Design**: Works on desktop and mobile devices

### 3. Media Browser (`src/components/MediaBrowser.tsx`)
- **Content Discovery**: Browse Facebook posts and Instagram reels from connected accounts
- **Media Selection**: Click to select and share media with WhatsApp customers
- **Account Switching**: Toggle between different Facebook pages and Instagram accounts
- **Visual Interface**: Thumbnail grid with engagement metrics (likes, comments)
- **Search & Filter**: Browse recent content with type filtering (photos, videos, reels)

### 4. Backend API (`api/facebook.js`)
- **OAuth Handling**: Exchange authorization codes for access tokens
- **Graph API Integration**: Fetch user data, pages, and Instagram accounts
- **Media Retrieval**: Get posts, photos, videos, and reels from Facebook Graph API
- **Error Handling**: Comprehensive error management and CORS support
- **Token Management**: Secure handling of access tokens

## User Flow

### 1. Initial Setup
1. User clicks Facebook integration button in ActionBar
2. MetaIntegrationPage opens with connection interface
3. User clicks "Connect Facebook & Instagram"
4. Facebook OAuth popup opens for authentication
5. After successful login, user's pages and Instagram accounts are displayed
6. User can enable/disable specific accounts for content sharing

### 2. Media Sharing
1. In ChatPage, user clicks attachment menu
2. User selects "Media" option from the menu
3. MediaBrowser opens showing connected social media content
4. User can switch between Facebook pages and Instagram accounts
5. User browses available posts, photos, and reels
6. User clicks on desired media to share with WhatsApp customer
7. Selected media appears in the chat conversation

### 3. Account Management
- Users can disconnect their Facebook account anytime
- Individual page/Instagram account integration can be toggled on/off
- Connection status is preserved across browser sessions
- Real-time status updates show active integrations

## Technical Architecture

### Frontend Components
```
ActionBar
├── Facebook Integration Button → Opens MetaIntegrationPage
└── MetaIntegrationPage
    ├── Connection Flow
    ├── Account Management
    └── Toggle Controls

ChatPage
├── Attachment Menu
└── Media Option → Opens MediaBrowser
    ├── Platform Tabs (Facebook/Instagram)
    ├── Account Selector
    ├── Media Grid
    └── Media Selection Handler
```

### Backend Endpoints
```
/api/facebook?action=auth-url          - Get OAuth URL
/api/facebook?action=exchange-code     - Exchange code for token
/api/facebook?action=user-info         - Get user information
/api/facebook?action=pages             - Get user's Facebook pages
/api/facebook?action=instagram         - Get Instagram business accounts
/api/facebook?action=page-media        - Get Facebook page posts
/api/facebook?action=instagram-media   - Get Instagram posts
/api/facebook?action=instagram-reels   - Get Instagram reels specifically
/api/facebook?action=toggle-page       - Enable/disable page integration
/api/facebook?action=toggle-instagram  - Enable/disable Instagram integration
/api/facebook?action=disconnect        - Disconnect Facebook account
```

### Data Flow
1. **Authentication**: OAuth2 popup → Authorization code → Access token exchange
2. **Media Retrieval**: Facebook Graph API → Backend processing → Frontend display
3. **Content Sharing**: Media selection → WhatsApp message → Customer delivery
4. **State Management**: LocalStorage persistence → Session continuity

## Security Features

### Privacy Protection
- File names and sensitive metadata are not exposed in logs
- Media URLs are proxied through secure endpoints
- Access tokens are handled server-side only
- CORS protection on all API endpoints

### Data Handling
- No permanent storage of Facebook content
- Real-time fetching ensures fresh content
- User can revoke access anytime
- Minimal data collection (only necessary for functionality)

## Configuration

### Environment Variables
```bash
# Facebook App Configuration
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret_here
VITE_FACEBOOK_REDIRECT_URI=http://localhost:5173/auth/facebook/callback
VITE_FACEBOOK_API_VERSION=v18.0

# Privacy Settings
VITE_PRIVACY_MODE=true
```

### Required Facebook App Permissions
- `pages_read_engagement` - Read page posts and engagement metrics
- `pages_manage_posts` - Access page content for sharing
- `pages_show_list` - List user's managed pages
- `instagram_basic` - Basic Instagram account access
- `instagram_content_publish` - Access Instagram content
- `publish_video` - Access video content

## Testing & Validation

### Local Development
1. Start backend server: `node server.js` (Port 3000)
2. Start frontend server: `npm run dev` (Port 5173)
3. Configure Facebook app with redirect URI: `http://localhost:5173/auth/facebook/callback`
4. Test OAuth flow through MetaIntegrationPage
5. Test media browsing through ChatPage → Attachment → Media

### Integration Verification
- ✅ Facebook OAuth popup authentication
- ✅ Account connection and disconnection
- ✅ Page and Instagram account listing
- ✅ Media browsing and selection
- ✅ Content sharing in WhatsApp chat
- ✅ Toggle controls for account management
- ✅ Responsive design across devices
- ✅ Error handling and user feedback

## Future Enhancements

### Planned Features
1. **Content Filtering**: Filter by date, engagement, content type
2. **Bulk Sharing**: Select multiple media items for sharing
3. **Scheduled Posts**: Schedule content sharing for later
4. **Analytics**: Track shared content performance
5. **Custom Captions**: Edit captions before sharing
6. **Media Upload**: Upload new content to social accounts

### Technical Improvements
1. **Caching**: Implement media caching for faster browsing
2. **Pagination**: Add infinite scroll for large media libraries
3. **Search**: Add text search across media captions
4. **Webhook Integration**: Real-time updates for new content
5. **Multi-Account**: Support multiple Facebook accounts per user

## Support & Troubleshooting

### Common Issues
1. **OAuth Popup Blocked**: Ensure popup blockers are disabled
2. **Token Expiration**: Reconnect Facebook account if media fails to load
3. **Missing Permissions**: Verify Facebook app has required permissions
4. **CORS Errors**: Check backend server is running and accessible

### Debug Information
- Frontend logs available in browser console
- Backend logs show API request/response details
- Network tab shows Facebook Graph API calls
- Connection status displayed in MetaIntegrationPage

---

**Integration Status**: ✅ Complete and Ready for Production
**Last Updated**: July 31, 2025
**Version**: 1.0.0
