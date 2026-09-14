/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if the authenticated user possesses one of the authorized roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      const returnUrl = encodeURIComponent(req.originalUrl || '/');
      return res.redirect(`/auth/login?redirect=${returnUrl}`);
    }

    const userRole = req.session.role;

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Role check failed: Render 403 Access Denied
    const isApi = req.path.startsWith('/api/') || 
                  req.xhr || 
                  (req.headers.accept && req.headers.accept.includes('application/json'));

    if (isApi) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    return res.status(403).render('errors/403', {
      currentUser: {
        userId: req.session.userLoginId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role
      },
      message: userRole === 'member' && allowedRoles.includes('admin')
        ? 'You are logged in as a Member. The Finance Management System and Admin Controls are strictly reserved for Executive Administrators.'
        : 'You do not have permission to access this resource.'
    });
  };
}

module.exports = { requireRole };
