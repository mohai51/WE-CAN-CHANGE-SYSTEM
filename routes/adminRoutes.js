const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/dashboard', isAuthenticated, requireRole('admin', 'coordinator'), adminController.dashboard);

module.exports = router;
