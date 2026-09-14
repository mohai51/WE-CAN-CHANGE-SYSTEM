const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Setup Google Strategy if credentials exist in environment
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

if (googleClientId && googleClientSecret && !googleClientId.includes('your_google_client_id')) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;
          if (!email) {
            return done(new Error('No email found in Google account profile'), null);
          }

          // Check if user already exists by googleId or email
          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }]
          });

          if (user) {
            // Update googleId & avatar if not already set
            let updated = false;
            if (!user.googleId) {
              user.googleId = profile.id;
              updated = true;
            }
            if (profile.photos && profile.photos[0] && !user.avatar) {
              user.avatar = profile.photos[0].value;
              updated = true;
            }
            if (updated) await user.save();
            return done(null, user);
          }

          // Create new member user from Google profile
          const baseUserId = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'user';
          let uniqueUserId = baseUserId;
          let counter = 1;
          while (await User.findOne({ userId: uniqueUserId })) {
            uniqueUserId = `${baseUserId}${counter++}`;
          }

          user = await User.create({
            userId: uniqueUserId,
            name: profile.displayName || profile.name?.givenName || 'Google User',
            email: email,
            role: 'member', // Default role for external signups
            googleId: profile.id,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            status: 'active'
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('✓ Google OAuth 2.0 Strategy initialized');
} else {
  console.log('ℹ Google OAuth credentials not set in .env (add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET to enable)');
}

module.exports = passport;
