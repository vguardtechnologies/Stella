import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { VercelRequest, VercelResponse } from '@vercel/node';

export interface AuthUser {
  id: string;
  email: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly SALT_ROUNDS = 12;

  // Generate JWT token
  static generateToken(user: AuthUser): string {
    return jwt.sign(
      { id: user.id, email: user.email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as AuthUser;
      return decoded;
    } catch {
      return null;
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Compare password
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Extract token from request
  static extractToken(req: VercelRequest): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  // Middleware to verify authentication
  static authenticate(req: VercelRequest): AuthUser | null {
    const token = this.extractToken(req);
    if (!token) {
      return null;
    }
    return this.verifyToken(token);
  }
}

// Middleware function for protected routes
export function withAuth(handler: (req: VercelRequest, res: VercelResponse, user: AuthUser) => Promise<VercelResponse | void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const user = AuthService.authenticate(req);
      if (!user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Valid authentication token required' 
        });
      }
      await handler(req, res, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Authentication failed' 
      });
    }
  };
}
