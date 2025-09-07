const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Configuración real de Gmail para envío de emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para puerto 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER || 'tu-email@gmail.com', // Reemplazar con el email real
    pass: process.env.EMAIL_PASS || 'tu-contraseña-de-aplicacion' // Reemplaza con la contraseña de aplicación
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Almacenamiento temporal de tokens "Cambiar a la bd posteriormente"
const resetTokens = new Map();

// Se verifica la configuración del transporter
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuración de email verificada correctamente');
  } catch (error) {
    console.log('⚠️  Error en configuración de email:', error.message);
    console.log('📝 Para usar emails reales, configura EMAIL_USER y EMAIL_PASS en el archivo .env');
  }
};

// Verificar la configuración al iniciar
verifyEmailConfig();

// Endpoint para solicitar restablecimiento de contraseña
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email es requerido' 
      });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de email inválido' 
      });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hora en millisegundos

    // Guardar token con expiración "También se debe cambiar a la BD"
    resetTokens.set(resetToken, {
      email: email,
      expiry: tokenExpiry,
      used: false
    });

    // Crear enlace de restablecimiento "Cambiar FRONTEND_URL"
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Configurar el email
    const mailOptions = {
      from: `"Pichulie App" <${process.env.EMAIL_USER || 'noreply@pichulie.com'}>`,
      to: email,
      subject: 'Restablecimiento de Contraseña - Pichulie',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔒 Restablecimiento de Contraseña</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hola,
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Has solicitado restablecer tu contraseña en Pichulie. Haz clic en el siguiente botón para continuar:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Restablecer Contraseña
              </a>
            </div>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> y solo puede ser usado <strong>una vez</strong>.
              </p>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              Si no solicitaste este restablecimiento, puedes ignorar este email de forma segura.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este es un email automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      `
    };

    // Enviar email real
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 Para:', email);
      console.log('📧 Token generado:', resetToken);
      
      // Responder exitosamente
      res.status(200).json({
        success: true,
        message: 'Revisa tu correo para continuar'
      });

    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError.message);
      
      /**
      // Si no se puede enviar email real, se simula "Borrar cuando se implemente el email real"
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Activando modo de respaldo para desarrollo');
        console.log('📧 Email que se habría enviado a:', email);
        console.log('📧 Enlace de restablecimiento:', resetLink);
        console.log('📧 Token:', resetToken);
        
        res.status(200).json({
          success: true,
          message: 'Revisa tu correo para continuar',
          devNote: 'Email simulado - revisa la consola para el enlace'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error al enviar el correo electrónico'
        });
      } */
    }

  } catch (error) {
    console.error('Error al enviar email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para validar token
router.get('/validate-reset-token/:token', (req, res) => {
  const { token } = req.params;
  
  const tokenData = resetTokens.get(token);
  
  if (!tokenData) {
    return res.status(400).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }

  if (tokenData.used) {
    return res.status(400).json({ 
      success: false, 
      message: 'Token ya utilizado' 
    });
  }

  if (Date.now() > tokenData.expiry) {
    resetTokens.delete(token);
    return res.status(400).json({ 
      success: false, 
      message: 'Token expirado' 
    });
  }

  res.status(200).json({
    success: true,
    message: 'Token válido',
    email: tokenData.email
  });
});

module.exports = router;