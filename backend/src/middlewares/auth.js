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
        message: 'Access Token Required'
      });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify that the user exists and is not blocked
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User Not Found'
      });
    }

    if (user.isBlocked) {
      return res.status(423).json({
        success: false,
        message: 'Account Temporarily Blocked'
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
        message: 'Invalid Token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Expired Token'
      });
    }

    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth middleware error:', error);
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication Error'
    });
  }
};

module.exports = {
  authenticateToken
};
