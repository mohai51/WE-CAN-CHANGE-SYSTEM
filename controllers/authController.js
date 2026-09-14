const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to normalize username / email
function cleanIdentifier(id) {
  return String(id || '').trim().toLowerCase();
}

// GET /auth/login
exports.showLogin = (req, res) => {
  // If user is already logged in, redirect them directly based on their role
  if (req.session && req.session.userId) {
    if (req.session.role === 'admin') {
      return res.redirect('/hub');
    }
    return res.redirect('/membership/my-profile.html');
  }

  const selectedRole = req.query.role === 'member' ? 'member' : 'admin';
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id')
  );

  res.render('auth/login', {
    error: req.query.error,
    success: req.query.success,
    selectedRole,
    googleEnabled,
    redirect: req.query.redirect || ''
  });
};

// GET /auth/register
exports.showRegister = (req, res) => {
  const selectedRole = req.query.role === 'admin' ? 'admin' : 'member';
  res.render('auth/register', {
    error: req.query.error,
    success: req.query.success,
    selectedRole
  });
};

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { userId, name, email, password, role, phone, pillar, adminSecretKey } = req.body;
    const cleanUser = cleanIdentifier(userId);
    const cleanMail = cleanIdentifier(email);

    if (!cleanUser || !cleanMail || !password || !name) {
      return res.redirect('/auth/register?error=All required fields must be filled');
    }

    // Check if email or userId already exists
    const existing = await User.findOne({
      $or: [{ email: cleanMail }, { userId: cleanUser }]
    });

    if (existing) {
      if (existing.email === cleanMail) {
        return res.redirect('/auth/register?error=Email already registered');
      }
      return res.redirect('/auth/register?error=User ID already taken');
    }

    // Role selection verification:
    // If requesting 'admin', require admin key (or default to member if unauthorized)
    let assignedRole = 'member';
    if (role === 'admin') {
      const serverAdminSecret = process.env.ADMIN_REGISTRATION_SECRET || 'WCC_ADMIN_2026';
      if (adminSecretKey && adminSecretKey.trim() === serverAdminSecret) {
        assignedRole = 'admin';
      } else {
        return res.redirect('/auth/register?role=admin&error=Invalid Admin Secret Key');
      }
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = await User.create({
      userId: cleanUser,
      name: name.trim(),
      email: cleanMail,
      password: hashedPassword,
      role: assignedRole,
      phone: phone ? phone.trim() : '',
      pillar: pillar || undefined,
      status: 'active'
    });

    // Establish session
    req.session.userId = newUser._id;
    req.session.userLoginId = newUser.userId;
    req.session.name = newUser.name;
    req.session.email = newUser.email;
    req.session.role = newUser.role;
    req.session.avatar = newUser.avatar || '';

    if (newUser.role === 'admin') {
      return res.redirect('/hub?welcome=true');
    }
    return res.redirect('/membership/my-profile.html');
  } catch (err) {
    console.error('Registration error:', err);
    res.redirect('/auth/register?error=Registration failed, please try again');
  }
};

// POST /auth/login (Traditional Form Submission)
exports.login = async (req, res) => {
  try {
    const { loginId, password, selectedRole, redirect: returnUrl } = req.body;
    const cleanId = cleanIdentifier(loginId);
    const cleanPass = String(password || '').trim();
    const reqRole = selectedRole === 'member' ? 'member' : 'admin';

    if (!cleanId || !cleanPass) {
      return res.redirect(`/auth/login?role=${reqRole}&error=Please enter your User ID or Email, and Password`);
    }

    // Query user by userId OR email
    const user = await User.findOne({
      $or: [{ userId: cleanId }, { email: cleanId }]
    });

    if (!user) {
      return res.redirect(`/auth/login?role=${reqRole}&error=Invalid User ID/Email or Password`);
    }

    if (user.status === 'inactive') {
      return res.redirect(`/auth/login?role=${reqRole}&error=Your account is inactive. Please contact the administrator.`);
    }

    if (!user.password) {
      return res.redirect(`/auth/login?role=${reqRole}&error=This account was created with Google. Please use Google Sign-In.`);
    }

    const match = await bcrypt.compare(cleanPass, user.password);
    if (!match) {
      return res.redirect(`/auth/login?role=${reqRole}&error=Invalid User ID/Email or Password`);
    }

    // Role-Based Validation:
    // If user specifically picked Admin tab, but the account is only a Member
    if (reqRole === 'admin' && user.role !== 'admin') {
      return res.redirect(`/auth/login?role=admin&error=Access Denied: Account '${user.userId}' does not have Administrator privileges. Please switch to the Member Login tab.`);
    }

    // Set unified session variables
    req.session.userId = user._id;
    req.session.userLoginId = user.userId;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.role = user.role;
    req.session.avatar = user.avatar || '';

    // Route user based on their role
    if (user.role === 'admin') {
      if (returnUrl && !returnUrl.includes('/auth/') && !returnUrl.includes('null')) {
        return res.redirect(returnUrl);
      }
      return res.redirect('/hub');
    } else {
      // Member can only access Member Management
      return res.redirect('/membership/my-profile.html');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.redirect('/auth/login?error=Authentication error, please try again');
  }
};

// POST /api/auth/login (JSON API for asynchronous client login)
exports.apiLogin = async (req, res) => {
  try {
    const { loginId, password, selectedRole } = req.body;
    const cleanId = cleanIdentifier(loginId);
    const cleanPass = String(password || '').trim();
    const reqRole = selectedRole === 'member' ? 'member' : 'admin';

    if (!cleanId || !cleanPass) {
      return res.status(400).json({ success: false, message: 'Please enter your User ID or Email, and Password.' });
    }

    const user = await User.findOne({
      $or: [{ userId: cleanId }, { email: cleanId }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials entered.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is currently inactive.' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'This account uses Google Sign-In.' });
    }

    const match = await bcrypt.compare(cleanPass, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials entered.' });
    }

    if (reqRole === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Account '${user.userId}' does not have Administrator privileges.`
      });
    }

    // Set unified session variables
    req.session.userId = user._id;
    req.session.userLoginId = user.userId;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.role = user.role;
    req.session.avatar = user.avatar || '';

    const safeUser = {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      canAccessFinance: user.role === 'admin',
      canAccessMembership: true
    };

    const redirectUrl = user.role === 'admin' ? '/hub' : '/membership/my-profile.html';

    return res.json({
      success: true,
      message: `Welcome, ${user.name}!`,
      user: safeUser,
      redirectUrl
    });
  } catch (err) {
    console.error('API login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

// GET /api/auth/session (Get current authenticated user info)
exports.apiSession = (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({
      isAuthenticated: true,
      user: {
        id: req.session.userId,
        userId: req.session.userLoginId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role,
        avatar: req.session.avatar || '',
        canAccessFinance: req.session.role === 'admin',
        canAccessMembership: true
      }
    });
  }
  return res.json({
    isAuthenticated: false,
    user: null
  });
};

// Google OAuth Success Callback
exports.googleCallback = (req, res) => {
  if (!req.user) {
    return res.redirect('/auth/login?error=Google authentication failed');
  }

  // Populate session with Google user
  req.session.userId = req.user._id;
  req.session.userLoginId = req.user.userId;
  req.session.name = req.user.name;
  req.session.email = req.user.email;
  req.session.role = req.user.role;
  req.session.avatar = req.user.avatar || '';

  if (req.user.role === 'admin') {
    return res.redirect('/hub');
  } else {
    return res.redirect('/membership/my-profile.html');
  }
};

// GET & POST /auth/logout (Single Unified Logout)
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destruction error:', err);
    res.clearCookie('connect.sid');
    return res.redirect('/auth/login?success=You+have+been+logged+out+successfully');
  });
};
