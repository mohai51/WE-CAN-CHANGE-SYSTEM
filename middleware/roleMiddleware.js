function requireRole(...roles) {
  return (req, res, next) => {
    if (req.session && roles.includes(req.session.role)) return next();
    res.status(403).send('Access denied');
  };
}

module.exports = { requireRole };
