import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { Database } from '../lib/database';
import { AuthService } from '../lib/auth';

// Request validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

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

  try {
    // Initialize database tables if needed
    await Database.initializeTables();

    if (req.method === 'POST') {
      const { action } = req.query;

      if (action === 'register') {
        return await handleRegister(req, res);
      } else if (action === 'login') {
        return await handleLogin(req, res);
      } else {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'Invalid action. Use ?action=register or ?action=login' 
        });
      }
    } else {
      return res.status(405).json({ 
        error: 'Method Not Allowed',
        message: 'Only POST method is allowed' 
      });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Authentication service temporarily unavailable' 
    });
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: validation.error.errors
      });
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = await Database.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    // Hash password and create user
    const passwordHash = await AuthService.hashPassword(password);
    const user = await Database.createUser(email, passwordHash);

    // Generate token
    const token = AuthService.generateToken({ id: user.id, email: user.email });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: validation.error.errors
      });
    }

    const { email, password } = validation.data;

    // Get user by email
    const user = await Database.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await AuthService.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = AuthService.generateToken({ id: user.id, email: user.email });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user'
    });
  }
}
