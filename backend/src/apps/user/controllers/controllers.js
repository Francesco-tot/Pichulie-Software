const User = require('../models/models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Helper function for error handling
const handleServerError = (error, context, res) => {
  // Log error details only in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error(`${context} error:`, error);
    console.error('Stack trace:', error.stack);
  } else {
    // In production, log only essential info without sensitive details
    console.error(`${context} error occurred`);
  }
  
  // Always return generic message to users
  return res.status(500).json({ 
    success: false,
    message: 'Try it again later',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    // Search for the user email in the database
    if (!user) return res.status(401).json({ message: 'Invalid user' });  

    // Check if the password matches using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

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
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return handleServerError(error, 'Login', res);
  }
};


// Configure email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      // Security: Use 202 Accepted with generic response to prevent email enumeration
      return res.status(202).json({ 
        success: true,
        message: 'You will receive a reset link'
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save token and expiration date in the database (1 hour expiration)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset?token=${resetToken}`;

    // Configure email
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
      success: true,
      message: 'Reset link sent successfully'
    });

  } catch (error) {
    return handleServerError(error, 'Password reset request', res);
  }
};

// Confirm reset password with token
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

    // Search for user with the token (check all conditions separately)
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid reset token' 
      });
    }

    // Check if token was already used
    if (user.resetPasswordUsed) {
      return res.status(400).json({ 
        message: 'This reset link has already been used' 
      });
    }

    // Check if token expired
    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ 
        message: 'Reset token has expired' 
      });
    }

    // Hash the new password with bcrypt (10 salt rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and mark token as used
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordUsed = true;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Password reset successfully',
      redirectTo: '/login',
      redirectDelay: 500 // milliseconds
    });

  } catch (error) {
    return handleServerError(error, 'Password reset', res);
  }
};

// Validate reset token (without performing the reset yet)
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        message: 'Token is required',
        valid: false,
        errorType: 'missing_token'
      });
    }

    // First, find user with this token (regardless of expiration)
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return res.status(400).json({ 
        message: 'Enlace inválido o caducado',
        valid: false,
        errorType: 'invalid_token',
        canResend: false
      });
    }

    // Check if token was already used
    if (user.resetPasswordUsed) {
      return res.status(400).json({ 
        message: 'Este enlace ya fue utilizado',
        valid: false,
        errorType: 'token_used',
        canResend: true,
        email: user.email
      });
    }

    // Check if token expired
    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ 
        message: 'Enlace expirado',
        valid: false,
        errorType: 'token_expired',
        canResend: true,
        email: user.email
      });
    }

    // Valid token - return user email for the form
    res.status(200).json({ 
      message: 'Token is valid',
      valid: true,
      email: user.email,
      expiresAt: user.resetPasswordExpires
    });

  } catch (error) {
    // For validation endpoint
    if (process.env.NODE_ENV === 'development') {
      console.error('Token validation error:', error);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Token validation error occurred');
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Try it again later',
      valid: false,
      errorType: 'server_error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend reset token
const resendResetToken = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      // Security: Use 202 Accepted with generic response to prevent email enumeration
      return res.status(202).json({ 
        success: true,
        message: 'You will receive a reset link',
        note: 'For security reasons, we do not reveal if the email exists'
      });
    }

    // Generate a new reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save new token and expiration date, reset the "used" flag
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    user.resetPasswordUsed = false;
    await user.save();

    // Create reset link "Edit when frontend is ready"
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset?token=${resetToken}`;

    // Configure email
    const transporter = createEmailTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request (Resent) - Pichulie',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a new password reset link. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour and will replace any previous reset links.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Pichulie Team</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue anyway, token was saved
    }

    res.status(200).json({ 
      success: true,
      message: 'Nuevo enlace de restablecimiento enviado correctamente'
    });

  } catch (error) {
    return handleServerError(error, 'Resend reset token', res);
  }
};

module.exports = { login, requestPasswordReset, resetPassword, validateResetToken, resendResetToken };
