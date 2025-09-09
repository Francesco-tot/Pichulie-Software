// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  // Log error details only in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled error:', err);
    console.error('Stack trace:', err.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request method:', req.method);
    console.error('Request body:', req.body);
  } else {
    // In production, log only essential info
    console.error('Unhandled error occurred on:', req.originalUrl);
  }

  // Determine error status
  const statusCode = err.statusCode || err.status || 500;
  
  // Send appropriate response
  if (statusCode >= 500) {
    // Server errors (5xx)
    res.status(statusCode).json({
      success: false,
      message: 'Inténtalo de nuevo más tarde',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  } else {
    // Client errors (4xx) - pass through the original message
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Bad request',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'POST /api/users/login',
      'POST /api/users/register',
      'POST /api/users/request-reset',
      'GET /api/users/validate-token/:token',
      'POST /api/users/reset-password',
      'POST /api/users/resend-reset'
    ]
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler
};
