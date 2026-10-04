import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/authValidator.js';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

router.get('/me', authenticate, AuthController.getMe);
router.put('/profile', authenticate, validateRequest(updateProfileSchema), AuthController.updateProfile);
router.put('/change-password', authenticate, validateRequest(changePasswordSchema), AuthController.changePassword);

export default router;
