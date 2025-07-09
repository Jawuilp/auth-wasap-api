import axios from 'axios';
import crypto from 'crypto';

/**
 * Sends OTP via WhatsApp Cloud API (Meta)
 * @param {string} phoneNumber - User's phone number
 * @returns {string} - Generated OTP
 */
async function sendWhatsAppOTP(phoneNumber) {
  try {
    const otp = crypto.randomInt(100000, 999999).toString();
    const message = `Your verification code is ${otp}. It expires in 10 minutes.`;

    await axios.post(
      `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber.replace('+', ''), // WhatsApp API expects phone number without '+'
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return otp;
  } catch (error) {
    throw new Error(`Failed to send WhatsApp OTP: ${error.message}`);
  }
}

export { sendWhatsAppOTP };