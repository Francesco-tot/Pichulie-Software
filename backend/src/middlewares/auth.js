const jwt = require('jsonwebtoken');
const User = require('../apps/user/models/models');

/**
 * Middleware Authentication JWT
 * Verifies if the user has a valid token before accessing protected routes
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access Token Required',
        errorType: 'missing_token',
        action: 'redirect_to_login',
        redirectTo: '/login'
      });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify that the user exists and is not blocked
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        errorType: 'user_not_found',
        action: 'redirect_to_login',
        redirectTo: '/login'
      });
    }

    if (user.isBlocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily blocked',
        errorType: 'account_blocked',
        action: 'redirect_to_login',
        redirectTo: '/login'
      });
    }

    // Add User Info to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        errorType: 'invalid_token',
        action: 'redirect_to_login',
        redirectTo: '/login'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Login session expired',
        errorType: 'token_expired',
        action: 'redirect_to_login',
        redirectTo: '/login',
        redirectDelay: 1000 
      });
    }

    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth middleware error:', error);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Auth middleware error occurred');
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = {
  authenticateToken
};
