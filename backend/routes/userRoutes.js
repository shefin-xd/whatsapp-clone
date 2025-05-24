const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { allUsers } = require('../controllers/userController');

const router = express.Router();

// Only the search route for users
router.route('/').get(protect, allUsers);

module.exports = router;
