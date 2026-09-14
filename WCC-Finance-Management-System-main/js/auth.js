/**
 * WCC Finance Management & Accounting System
 * Strict Role-Based Authentication & Session Manager
 */

class AuthManager {
  constructor() {
    this.sessionKey = 'WCC_AUTH_SESSION';
    this.sessionMaxAge = 8 * 60 * 60 * 1000; // 8 hours maximum session
    this.sessionIdleTimeout = 60 * 60 * 1000; // 60 minutes idle timeout
    this.initSession();
    this.bindActivityListener();
    this.syncServerSession();
  }

  async hashPassword(password) {
    if (!password) return '';
    try {
      const msgUint8 = new TextEncoder().encode('WCC_SALT_2026_SECURE:' + password);
      if (window.crypto && window.crypto.subtle) {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('Crypto subtle unavailable, using fallback:', e);
    }
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'sha256_fallback_' + Math.abs(hash);
  }

  generateSessionToken() {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(24);
      window.crypto.getRandomValues(arr);
      return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    }
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  initSession() {
    const sessionData = localStorage.getItem(this.sessionKey);
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const now = Date.now();

        // Validate session expiry and idle timeout
        if (!session || !session.user || (session.expiresAt && now > session.expiresAt) || (session.lastActive && (now - session.lastActive > this.sessionIdleTimeout))) {
          this.logout(false);
          return;
        }

        // Update lastActive timestamp
        session.lastActive = now;
        localStorage.setItem(this.sessionKey, JSON.stringify(session));

        this.user = session.user;
        this.sessionToken = session.token;
        window.store.currentUser = this.user;
      } catch (e) {
        this.user = null;
        this.sessionToken = null;
      }
    } else {
      this.user = null;
      this.sessionToken = null;
    }
  }

  bindActivityListener() {
    const updateActive = () => {
      if (this.isAuthenticated()) {
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            session.lastActive = Date.now();
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
          } catch (e) {}
        }
      }
    };
    ['click', 'keydown', 'scroll'].forEach(evt => {
      window.addEventListener(evt, updateActive, { passive: true });
    });
  }

  isAuthenticated() {
    return !!this.user;
  }

  getCurrentUser() {
    return this.user;
  }

  async login(email, password) {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    const users = window.store.data.users || [];
    const matchedUser = users.find(u => u.email && u.email.toLowerCase() === trimmedEmail);

    if (!matchedUser) {
      throw new Error('No user account found with this email address.');
    }

    if (matchedUser.status === 'Inactive') {
      throw new Error('This user account has been deactivated by the Main Admin.');
    }

    // Password verification with hash support & fallback
    const expectedPassword = matchedUser.password || (matchedUser.role === 'Admin' ? 'admin123' : 'wcc123');
    const inputHash = await this.hashPassword(trimmedPass);
    const expectedHash = await this.hashPassword(expectedPassword);

    const isMatch = (trimmedPass === expectedPassword) || (matchedUser.passwordHash && matchedUser.passwordHash === inputHash) || (inputHash === expectedHash);

    if (!isMatch) {
      throw new Error('Incorrect password. If you forgot your password, please submit a reset request to the Main Admin below.');
    }

    // Sanitize user profile: scrub sensitive credentials from memory & localStorage
    const safeUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      phone: matchedUser.phone || '',
      avatar: matchedUser.avatar || matchedUser.name.substring(0, 2).toUpperCase(),
      status: matchedUser.status || 'Active'
    };

    const token = this.generateSessionToken();
    const now = Date.now();
    const sessionObj = {
      user: safeUser,
      token: token,
      createdAt: now,
      lastActive: now,
      expiresAt: now + this.sessionMaxAge
    };

    this.user = safeUser;
    this.sessionToken = token;
    window.store.currentUser = safeUser;
    localStorage.setItem(this.sessionKey, JSON.stringify(sessionObj));
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(safeUser));

    this.checkAuthGate();
    this.updateUIPermissions();
    window.UI.showToast(`Logged in successfully as ${safeUser.name} (${safeUser.role})`, 'success');
    window.UI.navigateTo('dashboard');
    return safeUser;
  }

  logout(showToast = true) {
    this.user = null;
    this.sessionToken = null;
    if (window.store) window.store.currentUser = null;
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_USER);
    window.location.href = '/auth/logout';
  }

  async syncServerSession() {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data && data.isAuthenticated && data.user) {
          if (data.user.role !== 'admin') {
            window.location.href = '/membership/my-profile.html';
            return;
          }
          const u = data.user;
          const safeUser = {
            id: u.id || 'admin_user',
            name: u.name || 'WCC Executive Administrator',
            email: u.email || 'admin@wecanchange.org',
            role: 'Admin',
            phone: '',
            avatar: (u.name || 'AD').substring(0, 2).toUpperCase(),
            status: 'Active'
          };
          const now = Date.now();
          const sessionObj = {
            user: safeUser,
            token: 'mongo_session_' + (u.id || Date.now()),
            createdAt: now,
            lastActive: now,
            expiresAt: now + this.sessionMaxAge
          };
          this.user = safeUser;
          this.sessionToken = sessionObj.token;
          if (window.store) window.store.currentUser = safeUser;
          localStorage.setItem(this.sessionKey, JSON.stringify(sessionObj));
          localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(safeUser));
          this.checkAuthGate();
          if (this.updateUIPermissions) this.updateUIPermissions();
          this.injectUnifiedNav();
          return;
        } else {
          window.location.href = '/auth/login?role=admin&redirect=' + encodeURIComponent(window.location.pathname);
        }
      }
    } catch(e) {
      console.warn('Finance session sync skipped:', e);
    }
    this.injectUnifiedNav();
  }

  injectUnifiedNav() {
    if (document.getElementById('unified-finance-admin-bar')) return;
    const navBar = document.createElement('div');
    navBar.id = 'unified-finance-admin-bar';
    navBar.style.cssText = 'background: #0B101B; color: #FFF; padding: 6px 16px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.12); position: relative; z-index: 99999; font-family: sans-serif;';
    navBar.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="color:#2ECC71; font-weight:700; display:flex; align-items:center; gap:4px;">
          <span>💰</span> WCC Finance Portal
        </span>
        <span style="opacity:0.4;">|</span>
        <a href="/hub" style="color:#94A3B8; text-decoration:none; font-weight:600; display:flex; align-items:center; gap:4px;">
          <span>🏛️</span> Executive Hub
        </a>
        <a href="/membership/dashboard.html" style="color:#F1AD1A; text-decoration:none; font-weight:600; display:flex; align-items:center; gap:4px;">
          <span>👥</span> Member Management
        </a>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="color:#94A3B8;">Admin: <strong style="color:#FFF;">${this.user ? this.user.name : 'Administrator'}</strong></span>
        <a href="/auth/logout" style="color:#FF7B7B; text-decoration:none; font-weight:600;">Sign Out 🚪</a>
      </div>
    `;
    document.body.insertBefore(navBar, document.body.firstChild);
  }

  hasPermission(permissionName) {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    
    // Main Admin has full unrestricted access to everything
    if (user.role === 'Admin') return true;

    const allowedRoles = CONFIG.PERMISSIONS[permissionName];
    if (!allowedRoles) return true;
    return allowedRoles.includes(user.role);
  }

  canEditFinance() {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    // Admin, Finance Manager, and Finance Officer can edit finance records
    return ['Admin', 'Finance Manager', 'Finance Officer'].includes(user.role);
  }

  checkAuthGate() {
    const loginWrapper = document.getElementById('login-screen-wrapper');
    const appContainer = document.querySelector('.app-container');

    if (!this.isAuthenticated()) {
      document.documentElement.classList.add('not-authenticated');
      document.documentElement.classList.remove('is-authenticated');
      if (loginWrapper) loginWrapper.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
    } else {
      document.documentElement.classList.add('is-authenticated');
      document.documentElement.classList.remove('not-authenticated');
      if (loginWrapper) loginWrapper.style.display = 'none';
      if (appContainer) appContainer.style.display = 'flex';
    }
  }

  updateUIPermissions() {
    const user = this.getCurrentUser();
    if (!user) return;
    
    // Update user profile display in sidebar & header
    const avatarEl = document.getElementById('user-avatar-badge');
    const nameEl = document.getElementById('user-profile-name');
    const roleEl = document.getElementById('user-profile-role');

    if (avatarEl) avatarEl.textContent = user.avatar || user.name.substring(0, 2).toUpperCase();
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;

    // Conditionally enable or disable views and buttons according to permissions
    document.querySelectorAll('[data-permission]').forEach(el => {
      const requiredPermission = el.getAttribute('data-permission');
      if (!this.hasPermission(requiredPermission)) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
  }
}

window.auth = new AuthManager();
