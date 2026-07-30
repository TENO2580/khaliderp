import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { successResponse, createdResponse, errorResponse } from '../utils/response';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      const user = await authService.register(req.body);
      createdResponse(res, user, 'User registered successfully');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      successResponse(res, result, 'Login successful');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/google
   */
  async googleLogin(req: Request, res: Response) {
    try {
      const result = await authService.loginWithGoogle(req.body);
      successResponse(res, result, 'Google authentication successful');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      successResponse(res, tokens, 'Token refreshed');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      if (req.user) {
        await authService.logout(req.user.id);
      }
      successResponse(res, null, 'Logged out successfully');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/auth/me
   */
  async me(req: Request, res: Response) {
    try {
      const user = await authService.getProfile(req.user!.id);
      successResponse(res, user);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const authController = new AuthController();
