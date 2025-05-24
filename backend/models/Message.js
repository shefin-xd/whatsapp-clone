const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, trim: true },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
        type: {
            type: String,
            enum: ['text', 'image'],
            default: 'text',
        },
        imageUrl: {
            type: String,
            required: function() { return this.type === 'image'; } // Required only if type is image
        },
        reactions: [ // For message reactions
            {
                reactor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                emoji: { type: String }, // e.g., '👍', '❤️'
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
