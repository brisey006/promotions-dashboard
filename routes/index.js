const express = require('express');
const router = express.Router();

router.use('/', require('./general'));
router.use('/', require('./user'));
router.use('/users', require('./users'));
router.use('/pages', require('./pages'));
router.use('/settings', require('./settings'));
router.use('/promotions', require('./promotions'));

module.exports = router;