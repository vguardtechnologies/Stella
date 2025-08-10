// Token validation utility for Facebook integration
export const validateFacebookToken = async (token: string): Promise<{
  isValid: boolean;
  tokenType: 'facebook' | 'whatsapp' | 'invalid' | 'unknown';
  error?: string;
  data?: any;
}> => {
  if (!token) {
    return { isValid: false, tokenType: 'invalid', error: 'No token provided' };
  }

  try {
    // Test 1: Try Facebook Graph API - Get user info
    const facebookTest = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${token}`);
    const facebookData = await facebookTest.json();

    if (facebookData.id && !facebookData.error) {
      // This is likely a Facebook token - test for pages access
      try {
        const pagesTest = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
        const pagesData = await pagesTest.json();
        
        if (pagesData.data) {
          return {
            isValid: true,
            tokenType: 'facebook',
            data: {
              user: facebookData,
              pages: pagesData.data.length,
              permissions: 'Facebook Graph API with pages access'
            }
          };
        }
      } catch (e) {
        // Facebook token but maybe missing permissions
        return {
          isValid: true,
          tokenType: 'facebook',
          error: 'Facebook token valid but missing pages permissions',
          data: { user: facebookData }
        };
      }
    }

    // Test 2: Check if it's a WhatsApp token by trying a WhatsApp API call
    if (facebookData.error && facebookData.error.code === 190) {
      // Try to detect if this might be a WhatsApp token
      // WhatsApp tokens often work with phone number queries but not user queries
      return {
        isValid: false,
        tokenType: 'whatsapp',
        error: 'This appears to be a WhatsApp token, not a Facebook token',
        data: { 
          hint: 'WhatsApp tokens are for messaging, Facebook tokens are for pages/content access',
          solution: 'Get a Facebook token from Graph API Explorer'
        }
      };
    }

    return {
      isValid: false,
      tokenType: 'invalid',
      error: facebookData.error?.message || 'Token validation failed'
    };

  } catch (error) {
    return {
      isValid: false,
      tokenType: 'unknown',
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const getTokenInfo = async (token: string) => {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/debug_token?input_token=${token}&access_token=${token}`);
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Token info error:', error);
    return null;
  }
};

export const getFacebookPermissions = async (token: string) => {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${token}`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Permissions error:', error);
    return [];
  }
};
