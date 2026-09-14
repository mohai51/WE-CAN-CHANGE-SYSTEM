const Program = require('../models/Program');
const Pillar = require('../models/Pillar');

// ---------- Public-facing ----------

// GET /programs  (public list, optionally filter by ?pillar=education)
exports.listAll = async (req, res) => {
  const filter = {};
  if (req.query.pillar) {
    const pillar = await Pillar.findOne({ name: new RegExp('^' + req.query.pillar + '$', 'i') });
    if (pillar) filter.pillar = pillar._id;
  }
  const programs = await Program.find(filter).populate('pillar').sort('-date');
  res.render('public/programs', { programs });
};

// ---------- Admin CRUD ----------

// GET /admin/programs
exports.adminIndex = async (req, res) => {
  const programs = await Program.find().populate('pillar').sort('-createdAt');
  res.render('admin/programs/index', { programs });
};

// GET /admin/programs/new
exports.createForm = async (req, res) => {
  const pillars = await Pillar.find().sort('name');
  res.render('admin/programs/form', { program: null, pillars, error: req.query.error });
};

// POST /admin/programs
exports.create = async (req, res) => {
  try {
    const { title, type, pillar, description, date, location } = req.body;
    await Program.create({
      title,
      type,
      pillar,
      description,
      date: date || undefined,
      location,
      createdBy: req.session.userId
    });
    res.redirect('/admin/programs');
  } catch (err) {
    res.redirect('/admin/programs/new?error=' + encodeURIComponent(err.message));
  }
};

// GET /admin/programs/:id/edit
exports.editForm = async (req, res) => {
  const program = await Program.findById(req.params.id);
  const pillars = await Pillar.find().sort('name');
  if (!program) return res.redirect('/admin/programs');
  res.render('admin/programs/form', { program, pillars, error: req.query.error });
};

// PUT /admin/programs/:id
exports.update = async (req, res) => {
  try {
    const { title, type, pillar, description, date, location } = req.body;
    await Program.findByIdAndUpdate(req.params.id, {
      title, type, pillar, description, date: date || undefined, location
    });
    res.redirect('/admin/programs');
  } catch (err) {
    res.redirect(`/admin/programs/${req.params.id}/edit?error=` + encodeURIComponent(err.message));
  }
};

// DELETE /admin/programs/:id
exports.remove = async (req, res) => {
  await Program.findByIdAndDelete(req.params.id);
  res.redirect('/admin/programs');
};
