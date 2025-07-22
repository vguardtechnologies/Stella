import { VercelRequest, VercelResponse } from '@vercel/node';
import { Database } from '../lib/database';
import { withAuth } from '../lib/auth';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']).end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { action } = req.query;

  if (action === 'me' && req.method === 'GET') {
    return withAuth(handleGetProfile)(req, res);
  } else if (action === 'refresh' && req.method === 'POST') {
    return withAuth(handleRefreshToken)(req, res);
  } else {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid action or method'
    });
  }
}

// Get current user profile
async function handleGetProfile(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const userProfile = await Database.getUserById(user.id);
    
    if (!userProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get WhatsApp configuration status
    const whatsappConfig = await Database.getWhatsAppConfigByUserId(user.id);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          created_at: userProfile.created_at
        },
        whatsapp: {
          configured: !!whatsappConfig,
          is_active: whatsappConfig?.is_active || false,
          phone_number_id: whatsappConfig?.phone_number_id || null
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
}

// Refresh JWT token
async function handleRefreshToken(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const userProfile = await Database.getUserById(user.id);
    
    if (!userProfile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Generate new token
    const { AuthService } = await import('../lib/auth');
    const newToken = AuthService.generateToken({ id: user.id, email: user.email });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user: {
          id: userProfile.id,
          email: userProfile.email
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token'
    });
  }
}
