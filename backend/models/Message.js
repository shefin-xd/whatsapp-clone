const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        chat: { // Link to the specific chat (one-to-one or group)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat', // Refers to the Chat model (which will also cover GroupChat later)
            required: true,
        },
        content: {
            type: String,
            trim: true,
        },
        type: { // 'text', 'image', 'video', 'audio', etc.
            type: String,
            enum: ['text', 'image'], // Starting with text and image
            default: 'text',
        },
        imageUrl: { // For image messages
            type: String,
        },
        readBy: [ // For read receipts (optional)
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        reactions: [ // For message reactions
            {
                reactor: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                emoji: String,
            },
        ],
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
