const User = require('../models/models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    // Search for the user email in the database
    if (!user) return res.status(401).json({ message: 'Invalid user' });  

    // Check if the password matches
    if (password !== user.password) return res.status(401).json({ message: 'Invalid password' });

    // Check if the user is blocked
    if (user.isBlocked) return res.status(423).json({mesagge: 'Account temporarily blocked'});

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },   // payload
      process.env.JWT_SECRET,                // secret password
      { expiresIn: '2h' }                    // token's duration
    );

    // If everything is fine, return user data, except for the password
    res.status(200).json({
      message: 'Succesful login',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    }
    return res.status(500).json({ message: 'Try again later' });
  }
};

// Configurar el transportador de email
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // Puedes cambiar esto según tu proveedor de email
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Solicitar reset de contraseña
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.status(200).json({ 
        message: 'If the email exists, a reset link has been sent' 
      });
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Guardar token y fecha de expiración en la base de datos (1 hora de expiración)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Crear enlace de reset
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset?token=${resetToken}`;

    // Configurar email
    const transporter = createEmailTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request - Pichulie',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Pichulie Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'If the email exists, a reset link has been sent' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ message: 'Error sending reset email' });
  }
};

// Confirmar reset de contraseña con token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Buscar usuario con el token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Actualizar contraseña y limpiar campos de reset
    user.password = newPassword; // En producción, deberías hashear la contraseña
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ 
      message: 'Password reset successful' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ message: 'Error resetting password' });
  }
};

// Validar token de reset (sin hacer el reset todavía)
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        message: 'Token is required',
        valid: false
      });
    }

    // Buscar usuario con el token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token',
        valid: false
      });
    }

    // Token válido - devolver información para el frontend
    res.status(200).json({ 
      message: 'Token is valid',
      valid: true,
      email: user.email, // Para mostrar en el formulario
      expiresAt: user.resetPasswordExpires
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ 
      message: 'Error validating token',
      valid: false
    });
  }
};

module.exports = { login, requestPasswordReset, resetPassword, validateResetToken };
