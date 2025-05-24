const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// @desc    Search for users
// @route   GET /api/users?search=keyword
// @access  Private
router.get(
    '/',
    protect,
    asyncHandler(async (req, res) => {
        const keyword = req.query.search
            ? {
                  $or: [
                      { username: { $regex: req.query.search, $options: 'i' } }, // Case-insensitive search
                      { email: { $regex: req.query.search, $options: 'i' } },
                  ],
              }
            : {};

        const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select('-password'); // Exclude current user and password

        res.send(users);
    })
);

module.exports = router;
