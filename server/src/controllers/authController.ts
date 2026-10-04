import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { config } from '../config/environment.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body, req);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Registration successful',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body, req);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, message: 'Refresh token required' });
      }
      const result = await AuthService.refresh(token);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      await AuthService.logout(token, req.user?.id, req);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!.id);
      return sendSuccess(res, { user }, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await AuthService.updateProfile(req.user!.id, req.body, req);
      return sendSuccess(res, { user: updated }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.changePassword(req.user!.id, req.body, req);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}
