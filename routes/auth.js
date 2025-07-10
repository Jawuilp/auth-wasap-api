import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { findUserById, createOrUpdateUser } from '../services/userService.js';
import { sendWhatsAppOTP } from '../services/whatsappService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/auth/request-otp
 * @desc Request OTP for whatsapp number
 * @access Public
 */
router.post(
  '/request-otp',
  [
    body('whatsappNumber')
      .trim()
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Invalid whatsapp number format')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { whatsappNumber } = req.body;
      let user = await findUserById(whatsappNumber); // Using whatsapp_number as temporary ID
      const otp = await sendWhatsAppOTP(whatsappNumber);

      await createOrUpdateUser({
        id: user ? user.id : whatsappNumber,
        name: user ? user.name : null,
        webEmail: user ? user.webEmail : null,
        whatsappNumber,
        conversationHistory: user ? user.conversationHistory : null,
        verificationCode: otp,
        codeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
    body('whatsappNumber')
      .trim()
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Invalid whatsapp number format'),
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

      const { whatsappNumber, otp } = req.body;
      const user = await findUserById(whatsappNumber);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Assuming verificationCode is handled externally or needs bcrypt
      if (!user.isVerified && new Date() > new Date(user.codeExpiresAt)) {
        return res.status(400).json({
          error: 'OTP expired',
          code: 'OTP_EXPIRED'
        });
      }

      // Placeholder for OTP verification (adjust if using bcrypt)
      const isValidOTP = otp === user.verificationCode; // Replace with proper comparison if encrypted
      if (!isValidOTP) {
        return res.status(400).json({
          error: 'Invalid OTP',
          code: 'INVALID_OTP'
        });
      }

      await createOrUpdateUser({
        id: user.id,
        name: user.name,
        webEmail: user.webEmail,
        whatsappNumber,
        conversationHistory: user.conversationHistory,
        isVerified: true,
        verificationCode: null,
        codeExpiresAt: null
      });

      const token = jwt.sign(
        { userId: user.id, whatsappNumber: user.whatsapp_number },
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

    const userData = {
      id: user.id,
      name: user.name,
      webEmail: user.webEmail,
      whatsappNumber: user.whatsapp_number,
      conversationHistory: user.conversation_history,
      createdAt: user.createdAt
    };

    res.status(200).json(userData);
  } catch (error) {
    next(error);
  }
});

export default router;