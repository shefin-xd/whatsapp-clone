require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
const fileUpload = require('express-fileupload'); // Import express-fileupload

// Import Models
const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // Import upload routes

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    },
});

// Connect to Database
connectDB();

// Middleware
app.use(express.json()); // For parsing application/json
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Express File Upload Middleware
app.use(fileUpload({
    useTempFiles: true, // Use temporary files to handle large uploads
    tempFileDir: '/tmp/', // Specify a directory for temporary files (important for deployment)
}));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Socket.io Logic
let onlineUsers = {}; // Stores { userId: socketId }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Event: setup - emitted by client on login
    socket.on('setup', (userId) => {
        socket.join(userId); // User joins their personal room
        onlineUsers[userId] = socket.id; // Mark user as online
        console.log(`User ${userId} connected and joined personal room.`);
        io.emit('online_users', onlineUsers); // Emit updated online users list to everyone
    });

    // Event: join_chat - emitted by client when selecting a chat
    socket.on('join_chat', (chatId) => {
        socket.join(chatId); // User joins the specific chat room
        console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    // Event: send_message - emitted by client when sending a message
    socket.on('send_message', async (newMessageReceived) => {
        let chat = newMessageReceived.chat;

        if (!chat.participants) {
            return console.log('Chat.participants not defined for received message');
        }

        try {
            // Ensure message object is fully formed for creation
            const { sender, content, type, imageUrl, chat: chatId } = newMessageReceived;
            let message = await Message.create({
                sender,
                chat: chatId,
                content: content || '', // Content might be empty for image-only messages
                type: type || 'text',
                imageUrl: imageUrl || null,
            });

            // Populate sender and chat details for broadcasting
            message = await message.populate('sender', 'username profilePicture');
            message = await message.populate('chat'); // Populate chat data including participants

            // Update lastMessage in the Chat model
            await Chat.findByIdAndUpdate(chat._id, { lastMessage: message._id });

            // Emit the message to all participants in the chat room
            chat.participants.forEach((participant) => {
                // Don't send notification to the sender if they are in the chat room
                if (participant._id.toString() === message.sender._id.toString() && socket.rooms.has(chat._id.toString())) {
                    io.to(participant._id.toString()).emit('receive_message', message);
                } else if (onlineUsers[participant._id.toString()] && io.sockets.sockets.get(onlineUsers[participant._id.toString()]).rooms.has(chat._id.toString())) {
                    // If recipient is online AND in the chat room, just send message
                    io.to(participant._id.toString()).emit('receive_message', message);
                } else if (onlineUsers[participant._id.toString()]) {
                    // If recipient is online but NOT in the chat room, send message AND notification
                    io.to(participant._id.toString()).emit('receive_message', message); // Still send message to update chat list
                    io.to(participant._id.toString()).emit('notification', message);
                }
            });
        } catch (error) {
            console.error('Error sending message via socket:', error);
        }
    });

    // Event: typing - emitted by client when typing
    socket.on('typing', (chatId) => socket.to(chatId).emit('typing', socket.id));

    // Event: stop_typing - emitted by client when stop typing
    socket.on('stop_typing', (chatId) => socket.to(chatId).emit('stop_typing', socket.id));

    // Event: message_reaction - emitted by client when reacting to a message
    socket.on('message_reaction', async ({ messageId, reactorId, emoji }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message) return;

            // Check if reaction already exists from this reactor
            const existingReactionIndex = message.reactions.findIndex(r => r.reactor.toString() === reactorId);

            if (existingReactionIndex > -1) {
                // Update existing reaction
                message.reactions[existingReactionIndex].emoji = emoji;
            } else {
                // Add new reaction
                message.reactions.push({ reactor: reactorId, emoji });
            }
            await message.save();

            // Emit to all participants in the chat
            const chat = await Chat.findById(message.chat);
            if (chat && chat.participants) {
                chat.participants.forEach(participant => {
                    io.to(participant._id.toString()).emit('new_reaction', {
                        messageId: message._id,
                        chat: chat._id,
                        reactorId: reactorId,
                        emoji: emoji,
                    });
                });
            }
        } catch (error) {
            console.error('Error handling message reaction:', error);
        }
    });


    // Event: disconnect - emitted when a user disconnects
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Find and remove the disconnected user from onlineUsers
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                // Update lastSeen for the disconnected user
                User.findByIdAndUpdate(userId, { lastSeen: new Date() }, { new: true })
                    .then(() => console.log(`User ${userId} last seen updated.`))
                    .catch(err => console.error(`Error updating lastSeen for ${userId}:`, err));
                break;
            }
        }
        io.emit('online_users', onlineUsers); // Emit updated online users list
    });

    // Custom disconnect event from client (e.g., on logout)
    socket.on('disconnect_user', (userId) => {
        console.log(`User ${userId} manually disconnected.`);
        if (onlineUsers[userId]) {
            delete onlineUsers[userId];
            User.findByIdAndUpdate(userId, { lastSeen: new Date() }, { new: true })
                .then(() => console.log(`User ${userId} last seen updated due to manual disconnect.`))
                .catch(err => console.error(`Error updating lastSeen for ${userId}:`, err));
        }
        io.emit('online_users', onlineUsers);
    });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
