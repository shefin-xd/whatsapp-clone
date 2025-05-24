const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message'); // Import Message model

const router = express.Router();

// Helper function to populate chat details for consistent response
const populateChat = (query) => {
    return query
        .populate('participants', '-password') // Exclude password from participants
        .populate('lastMessage')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username profilePicture',
            },
        });
};

// @desc    Access a chat or create one
// @route   POST /api/chats
// @access  Private
router.post(
    '/',
    protect,
    asyncHandler(async (req, res) => {
        const { userId } = req.body; // The ID of the user we want to chat with

        if (!userId) {
            res.status(400);
            throw new Error('UserId param not sent with request');
        }

        let isChat = await populateChat(Chat.find({
            isGroupChat: false,
            $and: [
                { participants: { $elemMatch: { $eq: req.user._id } } },
                { participants: { $elemMatch: { $eq: userId } } },
            ],
        }));

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            // Create a new chat
            const chatData = {
                chatName: 'sender', // Not used for 1-1, but kept for consistency
                isGroupChat: false,
                participants: [req.user._id, userId],
            };

            try {
                const createdChat = await Chat.create(chatData);
                const fullChat = await populateChat(
                    Chat.findOne({ _id: createdChat._id })
                );
                res.status(200).json(fullChat);
            } catch (error) {
                res.status(400);
                throw new Error(error.message);
            }
        }
    })
);

// @desc    Get all chats for the logged in user
// @route   GET /api/chats
// @access  Private
router.get(
    '/',
    protect,
    asyncHandler(async (req, res) => {
        try {
            let chats = await populateChat(
                Chat.find({ participants: { $elemMatch: { $eq: req.user._id } } })
            )
                .sort({ updatedAt: -1 }); // Sort by most recent activity

            res.status(200).send(chats);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    })
);


// @desc    Get all messages for a specific chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
router.get(
    '/:chatId/messages',
    protect,
    asyncHandler(async (req, res) => {
        try {
            const messages = await Message.find({ chat: req.params.chatId })
                .populate('sender', 'username profilePicture')
                .sort({ createdAt: 1 }); // Sort by oldest first

            res.json(messages);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    })
);


// @desc    Send a new message
// @route   POST /api/chats/:chatId/messages
// @access  Private
// NOTE: This will be primarily handled by Socket.io, but we can keep a REST endpoint
// for initial message sending or fallback.
router.post(
    '/:chatId/messages',
    protect,
    asyncHandler(async (req, res) => {
        const { content, type, imageUrl } = req.body;
        const chatId = req.params.chatId;

        if (!content && type !== 'image') { // Message can be just an image
            res.status(400);
            throw new Error('Content is required for text messages');
        }

        let newMessage = {
            sender: req.user._id,
            chat: chatId,
            content: content,
            type: type || 'text',
            imageUrl: imageUrl || null,
        };

        try {
            let message = await Message.create(newMessage);

            message = await message.populate('sender', 'username profilePicture');
            message = await message.populate('chat');

            // Update lastMessage in the Chat model
            await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

            res.json(message);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    })
);

module.exports = router;
