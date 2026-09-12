const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

router.get('/', programController.listAll);
router.post('/', programController.create);
router.put('/:id', programController.update);
router.delete('/:id', programController.remove);

module.exports = router;
