const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// @desc    Upload image to Cloudinary
// @route   POST /api/upload/image
// @access  Private
router.post(
    '/image',
    protect,
    asyncHandler(async (req, res) => {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                res.status(400);
                throw new Error('No files were uploaded.');
            }

            const file = req.files.image; // 'image' is the name of the input field

            // Validate file type (optional but recommended)
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                res.status(400);
                throw new Error('Only image files (jpeg, png, gif, webp) are allowed.');
            }

            // Upload image to Cloudinary
            const result = await cloudinary.uploader.upload(file.tempFilePath, {
                folder: 'mern-chat-app-images', // Optional: specify a folder in Cloudinary
                width: 1000, // Max width
                crop: 'limit', // Limit to width, maintaining aspect ratio
                quality: 'auto:low', // Optimize quality
                fetch_format: 'auto', // Optimize format (e.g., webp, avif)
            });

            // Return the Cloudinary URL
            res.status(200).json({
                url: result.secure_url,
                public_id: result.public_id,
            });
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            res.status(500);
            throw new Error(`Image upload failed: ${error.message}`);
        }
    })
);

module.exports = router;
