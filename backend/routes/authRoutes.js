const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateAccessToken = require('../utils/generateToken'); // <-- Corrected import

const router = express.Router();

// Removed the duplicate generateAccessToken function from here,
// as it's now imported from utils/generateToken.js
// const generateAccessToken = (id) => { ... };

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post(
    '/register',
    asyncHandler(async (req, res) => {
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
                token: generateAccessToken(user._id), // Use the imported function
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    })
);

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post(
    '/login',
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                token: generateAccessToken(user._id), // Use the imported function
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    })
);

module.exports = router;
