// Facebook API Client for Stella
// Handles communication with Facebook API endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
}

export interface FacebookPage {
  id: string;
  name: string;
  picture: {
    data: {
      url: string;
    };
  };
  access_token: string;
  instagram_business_account?: {
    id: string;
    name: string;
    profile_picture_url: string;
  };
}

export interface InstagramAccount {
  id: string;
  name: string;
  picture: string;
  pageId: string;
  pageName: string;
}

export interface FacebookMedia {
  id: string;
  type: 'photo' | 'video' | 'reel';
  thumbnail_url?: string;
  media_url: string;
  permalink_url: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  is_video?: boolean;
}

export interface FacebookAuthResponse {
  success: boolean;
  user: FacebookUser;
  accessToken: string;
  pages: FacebookPage[];
}

class FacebookAPIClient {
  // Get Facebook OAuth URL
  async getAuthUrl(): Promise<{ authUrl: string }> {
    const response = await fetch(`${API_BASE_URL}/api/facebook?action=auth-url`);
    
    if (!response.ok) {
      throw new Error(`Failed to get auth URL: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Exchange authorization code for access token
  async exchangeCode(code: string): Promise<FacebookAuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/facebook?action=exchange-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange code');
    }

    return response.json();
  }

  // Get user information
  async getUserInfo(accessToken: string): Promise<{ user: FacebookUser }> {
    const response = await fetch(
      `${API_BASE_URL}/api/facebook?action=user-info&accessToken=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user info');
    }

    return response.json();
  }

  // Get user pages
  async getPages(accessToken: string): Promise<{ pages: FacebookPage[] }> {
    const response = await fetch(
      `${API_BASE_URL}/api/facebook?action=pages&accessToken=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get pages');
    }

    return response.json();
  }

  // Get Instagram accounts
  async getInstagramAccounts(accessToken: string): Promise<{ instagram: InstagramAccount[] }> {
    const response = await fetch(
      `${API_BASE_URL}/api/facebook?action=instagram&accessToken=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Instagram accounts');
    }

    return response.json();
  }

  // Toggle page integration
  async togglePageIntegration(
    pageId: string, 
    enabled: boolean, 
    accessToken: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/facebook?action=toggle-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pageId, enabled, accessToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle page integration');
    }

    return response.json();
  }

  // Toggle Instagram integration
  async toggleInstagramIntegration(
    instagramId: string, 
    enabled: boolean, 
    accessToken: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/facebook?action=toggle-instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instagramId, enabled, accessToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle Instagram integration');
    }

    return response.json();
  }

  // Disconnect Facebook account
  async disconnect(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/facebook?action=disconnect`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect account');
    }

    return response.json();
  }

  // Open Facebook login popup
  openLoginPopup(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const { authUrl } = await this.getAuthUrl();
        
        const popup = window.open(
          authUrl,
          'facebook-login',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          reject(new Error('Failed to open popup window'));
          return;
        }

        // Listen for the popup to complete
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Login cancelled by user'));
          }
        }, 1000);

        // Listen for messages from the popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup.close();
            resolve(event.data.code);
          } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup.close();
            reject(new Error(event.data.error || 'Authentication failed'));
          }
        };

        window.addEventListener('message', messageListener);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Get Facebook page media/posts
  async getPageMedia(
    pageId: string, 
    accessToken: string, 
    limit: number = 20
  ): Promise<{ media: FacebookMedia[] }> {
    const response = await fetch(
      `${API_BASE_URL}/api/facebook?action=page-media&pageId=${pageId}&accessToken=${accessToken}&limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get page media');
    }

    return response.json();
  }

  // Get Instagram media/reels
  async getInstagramMedia(
    instagramId: string, 
    accessToken: string, 
    limit: number = 20
  ): Promise<{ media: InstagramMedia[] }> {
    const response = await fetch(
      `${API_BASE_URL}/api/facebook?action=instagram-media&instagramId=${instagramId}&accessToken=${accessToken}&limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Instagram media');
    }

    return response.json();
  }

  // Get Instagram reels specifically
  async getInstagramReels(
    instagramId: string, 
    accessToken: string, 
    limit: number = 20
  ): Promise<{ reels: InstagramMedia[] }> {
    const response = await fetch(
      `${API_BASE_URL}/api/facebook?action=instagram-reels&instagramId=${instagramId}&accessToken=${accessToken}&limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Instagram reels');
    }

    return response.json();
  }
}

export const facebookAPI = new FacebookAPIClient();
