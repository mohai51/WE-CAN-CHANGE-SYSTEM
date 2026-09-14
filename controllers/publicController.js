const Pillar = require('../models/Pillar');
const Program = require('../models/Program');

// GET /
exports.home = (req, res) => {
  // existing landing page content goes here - not rebuilt in this pass
  res.render('public/home');
};

// GET /vision-mission
exports.visionMission = (req, res) => {
  res.render('public/vision-mission');
};

// GET /pillars/:name
exports.pillarPage = async (req, res) => {
  const name = req.params.name;
  const pillar = await Pillar.findOne({ name: new RegExp('^' + name + '$', 'i') });
  const programs = pillar
    ? await Program.find({ pillar: pillar._id }).sort('-date')
    : [];
  res.render('public/pillar', { pillarName: name, pillar, programs });
};
