/**
 * Authentication Middleware
 * Ensures user has an active session before accessing protected pages or APIs
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  // Handle API/JSON requests
  const isApi = req.path.startsWith('/api/') || 
                req.xhr || 
                (req.headers.accept && req.headers.accept.includes('application/json'));

  if (isApi) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
      redirectUrl: '/auth/login'
    });
  }

  const returnUrl = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/auth/login?redirect=${returnUrl}`);
}

module.exports = { isAuthenticated };
