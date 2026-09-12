const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'coordinator', 'volunteer', 'member', 'donor'],
    default: 'member'
  },
  pillar: { type: String, enum: ['education', 'health', 'sports', 'culture', 'heritage'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
