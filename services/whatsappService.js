import axios from 'axios';
import crypto from 'crypto';

/**
 * Sends OTP via WhatsApp Cloud API (Meta)
 * @param {string} phoneNumber - User's phone number
 * @returns {string} - Generated OTP
 */
async function sendWhatsAppOTP(phoneNumber) {
  try {
    // Validar que las variables de entorno estén configuradas
    if (!process.env.WHATSAPP_API_URL) {
      throw new Error('WHATSAPP_API_URL no está configurada');
    }
    
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WHATSAPP_PHONE_NUMBER_ID no está configurada');
    }
    
    if (!process.env.WHATSAPP_API_TOKEN) {
      throw new Error('WHATSAPP_API_TOKEN no está configurada');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const message = `Tu código de verificación es ${otp}. Expira en 10 minutos.`;

    console.log('Enviando OTP a WhatsApp:', {
      url: `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      phoneNumber: phoneNumber.replace('+', ''),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
    });

    const response = await axios.post(
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

    console.log('Respuesta de WhatsApp API:', response.status, response.data);
    return otp;
  } catch (error) {
    console.error('Error completo de WhatsApp:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Token de WhatsApp inválido o expirado. Verifica WHATSAPP_API_TOKEN.');
    } else if (error.response?.status === 400) {
      throw new Error(`Error en la solicitud a WhatsApp: ${error.response.data?.error?.message || 'Datos inválidos'}`);
    } else if (error.response?.status === 403) {
      throw new Error('Sin permisos para enviar mensajes. Verifica la configuración de WhatsApp.');
    } else if (error.response?.status === 404) {
      throw new Error('Recurso de WhatsApp no encontrado. Verifica WHATSAPP_PHONE_NUMBER_ID.');
    } else {
      throw new Error(`Error al enviar OTP por WhatsApp: ${error.message}`);
    }
  }
}

export { sendWhatsAppOTP };