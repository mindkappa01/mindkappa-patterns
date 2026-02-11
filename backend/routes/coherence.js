const express = require('express');
const router = express.Router();
const CoherenceController = require('../controllers/coherenceController');

router.post('/calc', CoherenceController.calculate);

module.exports = router;
