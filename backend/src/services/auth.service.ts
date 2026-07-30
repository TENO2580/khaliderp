import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../middleware/error';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

export class AuthService {
  /**
   * Register a new user (admin-only operation)
   */
  async register(data: RegisterInput) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: data.role as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Login with email and password
   * Returns access + refresh tokens
   */
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact admin.', 403);
    }

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store refresh token in DB for revocation
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Supabase / Google OAuth Login Verification & Authorization Guard
   * Whitelisted Initial Authorized Users:
   * - Tenogte@gmail.com (Super Admin)
   * - Khalidshantp@gmail.com (Admin)
   */
  async loginWithGoogle(data: { email: string; googleId: string; name?: string; avatar?: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Search case-insensitively for pre-authorized user in database
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail }
      }
    });

    // Rejection rule: If email is NOT pre-authorized (Tenogte@gmail.com or Khalidshantp@gmail.com)
    if (!user) {
      throw new AppError(
        'Your Google account is not authorized to access Tripidio ERP. Please contact the system administrator.',
        403
      );
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact system administrator.', 403);
    }

    // First successful login: update Google ID, profile pic, display name, and last login timestamp
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: data.googleId || user.googleId,
        avatar: data.avatar || user.avatar,
        name: user.name || data.name || user.email.split('@')[0],
        lastLoginAt: new Date(),
      },
    });

    const payload: TokenPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: updatedUser.id },
      data: { refreshToken },
    });

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(token: string) {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Verify refresh token matches what's in DB (prevents reuse after logout)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.refreshToken !== token) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Rotate refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — clear refresh token
   */
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

export const authService = new AuthService();
