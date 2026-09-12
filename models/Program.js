const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pillar: { type: mongoose.Schema.Types.ObjectId, ref: 'Pillar', required: true },
  description: String,
  date: Date,
  location: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Program', programSchema);
