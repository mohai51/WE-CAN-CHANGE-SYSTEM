const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Web Auth Views & Actions
router.get('/login', authController.showLogin);
router.post('/login', (req, res, next) => {
  if (req.is('json') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return authController.apiLogin(req, res, next);
  }
  return authController.login(req, res, next);
});

router.get('/register', authController.showRegister);
router.post('/register', authController.register);
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// API Endpoints for Frontend SPA and Client Sync
router.get('/session', authController.apiSession);
router.get('/api/session', authController.apiSession);
router.post('/api/login', authController.apiLogin);

// Google OAuth 2.0 Routes
router.get(
  '/google',
  (req, res, next) => {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!googleClientId || !googleClientSecret || googleClientId.includes('your_google_client_id')) {
      return res.redirect('/auth/login?error=Google+Sign-In+is+not+configured+in+.env.+Please+contact+administrator.');
    }
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
  }
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/login?error=Google+Authentication+failed+or+was+cancelled'
  }),
  authController.googleCallback
);

module.exports = router;
