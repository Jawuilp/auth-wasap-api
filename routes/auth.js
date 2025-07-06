import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { findUserByPhoneNumber, createOrUpdateUser, findUserById } from '../services/userService.js';
import { sendWhatsAppOTP } from '../services/whatsappService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/auth/request-otp
 * @desc Request OTP for phone number
 * @access Public
 */
router.post(
  '/request-otp',
  [
    body('phoneNumber')
      .trim()
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phoneNumber } = req.body;
      
      let user = await findUserByPhoneNumber(phoneNumber);
      const otp = await sendWhatsAppOTP(phoneNumber);
      
      await createOrUpdateUser({
        phoneNumber,
        verificationCode: otp,
        codeExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        isVerified: user ? user.isVerified : false
      });

      res.status(200).json({
        message: 'OTP sent successfully',
        code: 'OTP_SENT'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and generate JWT
 * @access Public
 */
router.post(
  '/verify-otp',
  [
    body('phoneNumber')
      .trim()
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phoneNumber, otp } = req.body;
      const user = await findUserByPhoneNumber(phoneNumber);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isVerified && user.codeExpiresAt < new Date()) {
        return res.status(400).json({
          error: 'OTP expired',
          code: 'OTP_EXPIRED'
        });
      }

      const isValidOTP = await import('bcryptjs').then(bcrypt => bcrypt.compare(otp, user.verificationCode));
      if (!isValidOTP) {
        return res.status(400).json({
          error: 'Invalid OTP',
          code: 'INVALID_OTP'
        });
      }

      await createOrUpdateUser({
        phoneNumber,
        isVerified: true,
        verificationCode: null,
        codeExpiresAt: null
      });

      const token = jwt.sign(
        { userId: user.id || user._id, phoneNumber: user.phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        message: 'Authentication successful',
        token,
        code: 'AUTH_SUCCESS'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/auth/profile
 * @desc Get authenticated user profile
 * @access Private
 */
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    const { verificationCode, ...userData } = user; // Exclude verificationCode
    res.status(200).json(userData);
  } catch (error) {
    next(error);
  }
});

export default router;