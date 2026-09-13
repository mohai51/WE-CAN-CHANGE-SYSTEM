const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /auth/login
exports.showLogin = (req, res) => {
  res.render('auth/login', { error: req.query.error });
};

// GET /auth/register
exports.showRegister = (req, res) => {
  res.render('auth/register', { error: req.query.error });
};

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, pillar } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.redirect('/auth/register?error=Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'member', // default role; admin/coordinator assigned manually by an admin
      pillar: pillar || undefined
    });

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = user.name;

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/auth/register?error=Something went wrong, try again');
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect('/auth/login?error=Invalid email or password');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.redirect('/auth/login?error=Invalid email or password');
    }

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = user.name;

    if (user.role === 'admin' || user.role === 'coordinator') {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/auth/login?error=Something went wrong, try again');
  }
};

// GET /auth/logout
exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};
