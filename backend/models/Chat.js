const mongoose = require('mongoose');

const chatSchema = mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Message',
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        isGroupChat: { // To distinguish from group chats later
            type: Boolean,
            default: false,
        },
        // We might add a 'name' field for group chats later, but for 1-1 it's implied by participants
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
