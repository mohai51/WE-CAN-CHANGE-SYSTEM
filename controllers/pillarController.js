const Pillar = require('../models/Pillar');

// GET /admin/pillars
exports.index = async (req, res) => {
  const pillars = await Pillar.find().sort('name');
  res.render('admin/pillars/index', { pillars });
};

// GET /admin/pillars/new
exports.createForm = (req, res) => {
  res.render('admin/pillars/form', { pillar: null, error: req.query.error });
};

// POST /admin/pillars
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    await Pillar.create({ name, description });
    res.redirect('/admin/pillars');
  } catch (err) {
    res.redirect('/admin/pillars/new?error=' + encodeURIComponent(err.message));
  }
};

// GET /admin/pillars/:id/edit
exports.editForm = async (req, res) => {
  const pillar = await Pillar.findById(req.params.id);
  if (!pillar) return res.redirect('/admin/pillars');
  res.render('admin/pillars/form', { pillar, error: req.query.error });
};

// PUT /admin/pillars/:id
exports.update = async (req, res) => {
  try {
    const { name, description } = req.body;
    await Pillar.findByIdAndUpdate(req.params.id, { name, description });
    res.redirect('/admin/pillars');
  } catch (err) {
    res.redirect(`/admin/pillars/${req.params.id}/edit?error=` + encodeURIComponent(err.message));
  }
};

// DELETE /admin/pillars/:id
exports.remove = async (req, res) => {
  await Pillar.findByIdAndDelete(req.params.id);
  res.redirect('/admin/pillars');
};
