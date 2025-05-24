// backend/routes/userRoutes.js (NEW)
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { allUsers } = require('../controllers/userController'); // Only import allUsers

const router = express.Router();

router.route('/').get(protect, allUsers); // Only the search route remains

module.exports = router;
