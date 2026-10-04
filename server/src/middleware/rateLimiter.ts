import rateLimit from 'express-rate-limit';

// Standard rate limiter for all general API endpoints (100 req per 15 min)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes',
    errors: [],
  },
});

// Stricter rate limiter for sensitive authentication endpoints (prevent brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    errors: [],
  },
});
