const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  pillar: { type: mongoose.Schema.Types.ObjectId, ref: 'Pillar' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
