const mongoose = require('mongoose');

const pillarSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['Education', 'Health', 'Sports', 'Culture', 'Heritage'] },
  description: String
});

module.exports = mongoose.model('Pillar', pillarSchema);
