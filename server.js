require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const programRoutes = require('./routes/programRoutes');
const issueRoutes = require('./routes/issueRoutes');

const app = express();

connectDB();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'wcc_secret',
  resave: false,
  saveUninitialized: false
}));

// make current logged-in user available to every EJS view
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? { name: req.session.name, role: req.session.role }
    : null;
  next();
});

app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/programs', programRoutes);
app.use('/issues', issueRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WCC platform running on port ${PORT}`));
