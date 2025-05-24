// backend/routes/userRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { allUsers, registerUser } = require('../controllers/userController'); // Ensure allUsers is imported

const router = express.Router();

router.route('/').get(protect, allUsers); // This is the route for searching users
router.route('/register').post(registerUser); // Keep your registration route separate

module.exports = router;
