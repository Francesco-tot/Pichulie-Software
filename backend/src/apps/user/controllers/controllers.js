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

    // Set the token in a HttpOnly, Secure cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 2
    });

    // If everything is fine, return user data, except for the password
    res.status(200).json({
      message: 'Succesful login',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    }
    return res.status(500).json({ message: 'Try again later' });
  }
};

// Configure email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // Puedes cambiar esto según tu proveedor de email
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
      // For security, we do not reveal if the email exists or not
      return res.status(200).json({ 
        message: 'A reset link has been sent' 
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
      message: 'If the email exists, a reset link has been sent' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ message: 'Error sending reset email' });
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

    // Update password and mark token as used
    user.password = newPassword; // In production, you should hash the password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordUsed = true;
    await user.save();

    res.status(200).json({ 
      message: 'Password reset successful' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ message: 'Error resetting password' });
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
    console.error('Token validation error:', error);
    return res.status(500).json({ 
      message: 'Error validating token',
      valid: false,
      errorType: 'server_error'
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
      // For security, we do not reveal if the email exists or not
      return res.status(200).json({ 
        message: 'A new reset link has been sent' 
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
      message: 'If the email exists, a new reset link has been sent' 
    });

  } catch (error) {
    console.error('Resend token error:', error);
    return res.status(500).json({ message: 'Error sending reset email' });
  }
};

module.exports = { login, requestPasswordReset, resetPassword, validateResetToken, resendResetToken };
