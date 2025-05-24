// backend/controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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

// @desc    Register a new user (already covered)
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    // ... (your existing registerUser logic)
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email');
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
        res.status(400);
        throw new Error('Username already taken');
    }

    const user = await User.create({
        username,
        email,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

module.exports = { allUsers, registerUser };
