const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');

router.post('/save', SessionController.save);

module.exports = router;
