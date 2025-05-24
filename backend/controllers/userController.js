// backend/controllers/userController.js (NEW)
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
// const generateToken = require('../utils/generateToken'); // No longer needed here if only allUsers is exported

// @desc    Get all users or search users
// @route   GET /api/users?search=keyword
// @access  Private
const allUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search
        ? {
              $or: [
                  { username: { $regex: req.query.search, $options: 'i' } },
                  { email: { $regex: req.query.search, $options: 'i' } },
              ],
          }
        : {};

    // Find users, exclude the currently logged-in user from search results
    const users = await User.find(keyword)
        .find({ _id: { $ne: req.user._id } }) // req.user._id comes from `protect` middleware
        .select('-password'); // Exclude password from the results

    res.send(users);
});

module.exports = { allUsers }; // Only export allUsers
