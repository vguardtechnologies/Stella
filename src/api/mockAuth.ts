// Mock authentication API functions for development
import type { User, AuthResponse, LoginRequest, RegisterData, PasswordResetRequest, UpdateProfileRequest, ChangePasswordRequest } from '../types/auth';
import { authStorage } from '../utils/localStorage';

// Simulate API delay
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
const mockUsers: User[] = [
  {
    id: 'user_1',
    email: 'admin@example.com',
    fullName: 'John Admin',
    businessName: 'Example Business',
    phone: '+1234567890',
    role: 'admin',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'user_2',
    email: 'manager@example.com',
    fullName: 'Jane Manager',
    businessName: 'Another Business',
    phone: '+1234567891',
    role: 'manager',
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  }
];

// Mock session storage
let currentSession: {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
} | null = null;

// Helper functions
const generateToken = (): string => {
  return `stella_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const generateRefreshToken = (): string => {
  return `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Mock authentication API
export const mockAuthAPI = {
  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    await delay(1500);

    if (!isValidEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    if (!credentials.password) {
      throw new Error('Password is required');
    }

    // Demo credentials
    if (credentials.email === 'demo@stella.com' && credentials.password === 'Demo123!') {
      const user = mockUsers[0];
      const token = generateToken();
      const refreshToken = generateRefreshToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update last login
      user.lastLoginAt = new Date();

      currentSession = {
        user,
        token,
        refreshToken,
        expiresAt
      };

      const authResponse: AuthResponse = {
        user,
        token,
        refreshToken,
        expiresAt
      };

      // Save to localStorage
      authStorage.setAuth(authResponse);

      return authResponse;
    }

    // Manager credentials
    if (credentials.email === 'manager@stella.com' && credentials.password === 'Manager123!') {
      const user = mockUsers[1];
      const token = generateToken();
      const refreshToken = generateRefreshToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      user.lastLoginAt = new Date();

      currentSession = {
        user,
        token,
        refreshToken,
        expiresAt
      };

      const authResponse: AuthResponse = {
        user,
        token,
        refreshToken,
        expiresAt
      };

      authStorage.setAuth(authResponse);

      return authResponse;
    }

    // Simulate random login failures
    if (Math.random() < 0.1) {
      throw new Error('Service temporarily unavailable');
    }

    throw new Error('Invalid email or password');
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    await delay(2000);

    // Validation
    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (!isValidPassword(data.password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (!data.fullName || data.fullName.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters');
    }

    if (!data.businessName || data.businessName.trim().length < 2) {
      throw new Error('Business name is required');
    }

    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: data.email.toLowerCase(),
      fullName: data.fullName.trim(),
      businessName: data.businessName.trim(),
      phone: data.phone || undefined,
      role: 'admin', // First user is admin
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      created_at: new Date()
    };

    mockUsers.push(newUser);

    const token = generateToken();
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    currentSession = {
      user: newUser,
      token,
      refreshToken,
      expiresAt
    };

    const authResponse: AuthResponse = {
      user: newUser,
      token,
      refreshToken,
      expiresAt
    };

    authStorage.setAuth(authResponse);

    return authResponse;
  },

  // Logout
  async logout(): Promise<{ success: boolean }> {
    await delay(500);

    currentSession = null;
    authStorage.clearAuth();

    return { success: true };
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    await delay(800);

    if (!currentSession || currentSession.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const newToken = generateToken();
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    currentSession.token = newToken;
    currentSession.refreshToken = newRefreshToken;
    currentSession.expiresAt = expiresAt;

    const authResponse: AuthResponse = {
      user: currentSession.user,
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt
    };

    authStorage.setAuth(authResponse);

    return authResponse;
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    await delay(300);

    const token = authStorage.getToken();
    if (!token || !currentSession) {
      throw new Error('Not authenticated');
    }

    // Check if token is expired
    if (new Date() > currentSession.expiresAt) {
      currentSession = null;
      authStorage.clearAuth();
      throw new Error('Session expired');
    }

    return currentSession.user;
  },

  // Update profile
  async updateProfile(updates: UpdateProfileRequest): Promise<User> {
    await delay(1200);

    if (!currentSession) {
      throw new Error('Not authenticated');
    }

    const user = currentSession.user;

    // Validation
    if (updates.fullName !== undefined) {
      if (!updates.fullName || updates.fullName.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters');
      }
      user.fullName = updates.fullName.trim();
    }

    if (updates.businessName !== undefined) {
      if (!updates.businessName || updates.businessName.trim().length < 2) {
        throw new Error('Business name must be at least 2 characters');
      }
      user.businessName = updates.businessName.trim();
    }

    if (updates.phone !== undefined) {
      user.phone = updates.phone || undefined;
    }

    if (updates.avatar !== undefined) {
      user.avatar = updates.avatar || undefined;
    }

    user.updatedAt = new Date();

    // Update in mock users array
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = user;
    }

    // Update session and localStorage
    currentSession.user = user;
    const authResponse: AuthResponse = {
      user,
      token: currentSession.token,
      refreshToken: currentSession.refreshToken,
      expiresAt: currentSession.expiresAt
    };
    authStorage.setAuth(authResponse);

    return user;
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean }> {
    await delay(1500);

    if (!currentSession) {
      throw new Error('Not authenticated');
    }

    // In a real app, you'd verify the current password against the hash
    // For mock purposes, we'll just validate the new password
    if (!isValidPassword(data.newPassword)) {
      throw new Error('New password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new Error('New passwords do not match');
    }

    // In a real app, current password verification would happen here
    // For demo, we'll just accept any current password
    if (!data.currentPassword) {
      throw new Error('Current password is required');
    }

    return { success: true };
  },

  // Request password reset
  async requestPasswordReset(request: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
    await delay(1500);

    if (!isValidEmail(request.email)) {
      throw new Error('Invalid email format');
    }

    const user = mockUsers.find(u => u.email.toLowerCase() === request.email.toLowerCase());
    if (!user) {
      // Don't reveal if email exists for security
      return {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      };
    }

    return {
      success: true,
      message: 'Password reset email sent successfully.'
    };
  },

  // Verify email (mock)
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    await delay(1000);

    // In a real app, you'd verify the token
    if (!token || token.length < 10) {
      throw new Error('Invalid verification token');
    }

    return { success: true };
  },

  // Check authentication status
  async checkAuth(): Promise<{ isAuthenticated: boolean; user?: User }> {
    await delay(200);

    const token = authStorage.getToken();
    const user = authStorage.getUser();

    if (!token || !user) {
      return { isAuthenticated: false };
    }

    // In a real app, you'd verify the token with the server
    // For mock purposes, we'll assume it's valid if it exists
    return {
      isAuthenticated: true,
      user
    };
  }
};

// Utility functions for development
export const mockAuthUtils = {
  // Get demo credentials
  getDemoCredentials() {
    return {
      admin: {
        email: 'demo@stella.com',
        password: 'Demo123!'
      },
      manager: {
        email: 'manager@stella.com',
        password: 'Manager123!'
      }
    };
  },

  // Create test user
  createTestUser(email: string, fullName: string): User {
    return {
      id: `test_${Date.now()}`,
      email,
      fullName,
      businessName: 'Test Business',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      created_at: new Date()
    };
  },

  // Reset mock data
  resetMockData(): void {
    currentSession = null;
    mockUsers.length = 0;
    authStorage.clearAuth();
  },

  // Get current mock state
  getMockState() {
    return {
      users: [...mockUsers],
      currentSession: currentSession ? { ...currentSession } : null
    };
  },

  // Simulate different auth states
  simulateAuthState(state: 'authenticated' | 'expired' | 'invalid') {
    switch (state) {
      case 'authenticated':
        if (mockUsers.length > 0) {
          const user = mockUsers[0];
          currentSession = {
            user,
            token: generateToken(),
            refreshToken: generateRefreshToken(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          };
        }
        break;
      case 'expired':
        if (currentSession) {
          currentSession.expiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        }
        break;
      case 'invalid':
        currentSession = null;
        break;
    }
  }
};
