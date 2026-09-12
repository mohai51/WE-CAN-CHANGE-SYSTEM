const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

router.get('/', issueController.listAll);
router.post('/', issueController.submit);
router.put('/:id', issueController.updateStatus);

module.exports = router;
