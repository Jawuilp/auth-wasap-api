import axios from 'axios';
import crypto from 'crypto';

/**
 * Sends OTP via WhatsApp Cloud API (Meta) using a pre-approved template.
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
    // Necesitas el nombre exacto de la plantilla y el idioma
    if (!process.env.WHATSAPP_OTP_TEMPLATE_NAME) { // Nueva variable de entorno
        throw new Error('WHATSAPP_OTP_TEMPLATE_NAME no está configurada');
    }
    if (!process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE) { // Nueva variable de entorno
        throw new Error('WHATSAPP_OTP_TEMPLATE_LANGUAGE no está configurada');
    }


    const otp = crypto.randomInt(100000, 999999).toString();
    // La plantilla ya tiene el mensaje, solo necesitamos pasar los parámetros
    // const message = `Tu código de verificación es ${otp}. Expira en 10 minutos.`; // Esta línea ya no es necesaria para el cuerpo del mensaje

    console.log('Enviando OTP a WhatsApp usando plantilla:', {
      url: `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      phoneNumber: phoneNumber.replace('+', ''),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      templateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME,
      templateLanguage: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE
    });

    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber.replace('+', ''),
        type: 'template', // <--- ¡CAMBIO CLAVE AQUÍ!
        template: {
          name: process.env.WHATSAPP_OTP_TEMPLATE_NAME, // El nombre de tu plantilla, ej. 'otp_hazlo'
          language: {
            code: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE // El código de idioma, ej. 'es_MX' o 'es'
          },
          components: [ // Esto es para los placeholders ({{1}}, {{2}}, etc.)
            {
              type: 'body', // El cuerpo del mensaje de la plantilla
              parameters: [
                {
                  type: 'text',
                  text: otp // Esto reemplazará {{1}} en tu plantilla
                }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Respuesta de WhatsApp API (Plantilla):', response.status, response.data);
    return otp;
  } catch (error) {
    console.error('Error completo de WhatsApp (Plantilla):', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('Token de WhatsApp inválido o expirado. Verifica WHATSAPP_API_TOKEN.');
    } else if (error.response?.status === 400) {
      // Los errores 400 son comunes si la plantilla no está bien configurada o los parámetros no coinciden
      const errorMessage = error.response.data?.error?.message || 'Datos inválidos o plantilla no encontrada/aprobada.';
      throw new Error(`Error en la solicitud a WhatsApp (plantilla): ${errorMessage}`);
    } else if (error.response?.status === 403) {
      throw new Error('Sin permisos para enviar mensajes con plantilla. Verifica la configuración de WhatsApp.');
    } else if (error.response?.status === 404) {
      throw new Error('Recurso de WhatsApp no encontrado (plantilla). Verifica WHATSAPP_PHONE_NUMBER_ID o nombre de plantilla.');
    } else {
      throw new Error(`Error al enviar OTP por WhatsApp (plantilla): ${error.message}`);
    }
  }
}

export { sendWhatsAppOTP };