const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    // Optional if user registers/logs in via Google OAuth
    required: function() {
      return !this.googleId;
    }
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
    required: true
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  pillar: {
    type: String,
    enum: ['education', 'health', 'sports', 'culture', 'heritage']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
