const express = require('express');
const router = express.Router();

// homepage/landing page already exists - not rebuilding it here
router.get('/', (req, res) => res.render('public/home'));
router.get('/vision-mission', (req, res) => res.render('public/vision-mission'));
router.get('/pillars/:name', (req, res) => res.render('public/pillar'));

module.exports = router;
