require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const { isAuthenticated } = require('./middleware/authMiddleware');
const { requireRole } = require('./middleware/roleMiddleware');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const programRoutes = require('./routes/programRoutes');
const issueRoutes = require('./routes/issueRoutes');

const app = express();

// Connect MongoDB Atlas Database
connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Core middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'wcc_platform_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8 * 60 * 60 * 1000 // 8 hours session
  }
}));

// Initialize Passport for Google OAuth
app.use(passport.initialize());
app.use(passport.session());

// Global template locals for logged-in user
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? {
        id: req.session.userId,
        userId: req.session.userLoginId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role,
        avatar: req.session.avatar
      }
    : null;
  next();
});

// Root URL intelligent routing:
// - If Admin: redirect to Central Hub
// - If Member: redirect to Member Self-Service Portal
// - If unauthenticated: redirect to Single Unified Login
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    if (req.session.role === 'admin') {
      return res.redirect('/hub');
    }
    return res.redirect('/membership/my-profile.html');
  }
  return res.redirect('/auth/login');
});

// Central Executive Portal Hub for Admins
app.get('/hub', isAuthenticated, requireRole('admin'), (req, res) => {
  res.render('hub', {
    currentUser: {
      userId: req.session.userLoginId,
      name: req.session.name,
      email: req.session.email,
      role: req.session.role
    }
  });
});

// Auth Routes (Login, Register, Logout, Google OAuth, Session API)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Admin Routes (re-route admin dashboard to unified hub)
app.get('/admin/dashboard', isAuthenticated, requireRole('admin'), (req, res) => {
  res.redirect('/hub');
});
app.use('/admin', adminRoutes);

// =========================================================================
// 1. WCC Membership Management System Integration (/membership)
// =========================================================================
app.use(
  '/membership',
  isAuthenticated,
  (req, res, next) => {
    // If user is a Member, strictly restrict executive administration pages
    if (req.session.role === 'member') {
      const adminOnlyPages = ['dashboard.html', 'members.html', 'analytics.html', 'settings.html'];
      const reqPage = req.path.toLowerCase().replace(/^\//, '').split('?')[0];

      if (adminOnlyPages.includes(reqPage) || reqPage === '' || reqPage === 'index.html') {
        return res.redirect('/membership/my-profile.html');
      }
    }
    next();
  },
  express.static(path.join(__dirname, 'WCC_Membership_Management_System-main'))
);

// =========================================================================
// 2. WCC Finance Management & Accounting System Integration (/finance)
// Strictly restricted to 'admin' role only!
// =========================================================================
app.use(
  '/finance',
  isAuthenticated,
  requireRole('admin'),
  express.static(path.join(__dirname, 'WCC-Finance-Management-System-main'))
);

// Public, Pillar, and Program Routes
app.use('/public', publicRoutes);
app.use('/programs', programRoutes);
app.use('/issues', issueRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('errors/403', {
    currentUser: res.locals.currentUser,
    message: 'The requested page could not be found.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  We Can Change (WCC) Unified Platform Active`);
  console.log(`  Portal URL:       http://localhost:${PORT}`);
  console.log(`  Single Login:     http://localhost:${PORT}/auth/login`);
  console.log(`  Executive Hub:    http://localhost:${PORT}/hub`);
  console.log(`  Membership Sys:   http://localhost:${PORT}/membership/`);
  console.log(`  Finance Sys:      http://localhost:${PORT}/finance/`);
  console.log(`======================================================\n`);
});
