const Pillar = require('../models/Pillar');
const Program = require('../models/Program');
const User = require('../models/User');

// GET /admin/dashboard
exports.dashboard = async (req, res) => {
  const [pillarCount, programCount, userCount] = await Promise.all([
    Pillar.countDocuments(),
    Program.countDocuments(),
    User.countDocuments()
  ]);
  res.render('admin/dashboard', { pillarCount, programCount, userCount });
};
