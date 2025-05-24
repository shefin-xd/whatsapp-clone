const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message'); // Import Message model

// @desc    Access a chat (create if doesn't exist, or return existing)
// @route   POST /api/chats
// @access  Private
const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body; // The ID of the user you want to chat with

    if (!userId) {
        res.status(400);
        throw new Error('UserId param not sent with request');
    }

    // Check if a chat already exists between the two users
    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { participants: { $eq: req.user._id } }, // Current user
            { participants: { $eq: userId } }, // Other user
        ],
    })
        .populate('participants', '-password')
        .populate('lastMessage');

    isChat = await User.populate(isChat, {
        path: 'lastMessage.sender',
        select: 'username profilePicture email',
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        // If no chat exists, create a new one
        var chatData = {
            chatName: 'sender', // Will be dynamic on frontend
            isGroupChat: false,
            participants: [req.user._id, userId],
        };

        try {
            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                'participants',
                '-password'
            );
            res.status(200).json(fullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

// @desc    Fetch all chats for a user
// @route   GET /api/chats
// @access  Private
const fetchChats = asyncHandler(async (req, res) => {
    try {
        Chat.find({ participants: { $eq: req.user._id } })
            .populate('participants', '-password')
            .populate('groupAdmin', '-password')
            .populate('lastMessage')
            .sort({ updatedAt: -1 }) // Sort by last updated
            .then(async (results) => {
                results = await User.populate(results, {
                    path: 'lastMessage.sender',
                    select: 'username profilePicture email',
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Fetch messages for a specific chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
const allMessages = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate('sender', 'username profilePicture email')
            .populate('chat');
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = { accessChat, fetchChats, allMessages };
