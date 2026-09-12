const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  status: { type: String, enum: ['applied', 'approved', 'attended'], default: 'applied' },
  hours: { type: Number, default: 0 }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
