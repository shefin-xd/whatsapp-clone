const asyncHandler = require('express-async-handler');
const User = require('../models/User');

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
    // req.user._id is populated by the `protect` middleware
    const users = await User.find(keyword)
        .find({ _id: { $ne: req.user._id } })
        .select('-password'); // Exclude password from the results

    res.send(users);
});

module.exports = { allUsers };
