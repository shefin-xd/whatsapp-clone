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
const chatRoutes = require('./routes/chatRoutes'); // New chat routes
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // Import upload routes

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    pingTimeout: 60000, // Disconnects after 60s of no activity
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));

// Express File Upload Middleware
app.use(fileUpload({
    useTempFiles: true, // Use temporary files to handle large uploads
    tempFileDir: '/tmp/', // Specify a directory for temporary files (important for deployment)
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes); // Use chat routes
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes); // Use upload routes

app.get('/', (req, res) => {
    res.send('API is running...');
});

// --- Socket.io Logic ---
let onlineUsers = new Map(); // Store userId -> socketId for online presence

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user connects and provides their ID (e.g., after login)
    socket.on('setup', (userData) => {
        if (userData && userData._id) {
            socket.join(userData._id); // Join a personal room for notifications
            onlineUsers.set(userData._id, socket.id); // Mark user as online

            // Update user status in DB (optional, but good for persistence)
            User.findByIdAndUpdate(userData._id, { status: 'online', lastSeen: new Date() }).catch(console.error);

            io.emit('user_online', userData._id); // Notify all clients that this user is online
            console.log(`User ${userData.username} (${userData._id}) connected and joined personal room.`);
        }
    });

    // When a user joins a specific chat room
    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    // When a message is sent
    socket.on('send_message', async (newMessageReceived) => {
        let chat = newMessageReceived.chat;

        if (!chat.participants) {
            return console.log('Chat.participants not defined');
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
            message = await message.populate('chat');

            // Update lastMessage in the Chat model
            await Chat.findByIdAndUpdate(chat._id, { lastMessage: message._id });

            // Emit the message to all participants in the chat room
            chat.participants.forEach((participant) => {
                io.to(participant._id.toString()).emit('receive_message', message);
                // Also emit notification if user is not in the current chat room
                if (!socket.rooms.has(chat._id.toString()) || participant._id.toString() !== message.sender._id.toString()) {
                    io.to(participant._id.toString()).emit('notification', message);
                }
            });
        } catch (error) {
            console.error('Error sending message via socket:', error);
        }
    });

    // Typing indicator
    socket.on('typing', (chatId) => socket.to(chatId).emit('typing', socket.id));
    socket.on('stop_typing', (chatId) => socket.to(chatId).emit('stop_typing', socket.id));

    // Message reactions (basic)
    socket.on('message_reaction', async ({ messageId, reactorId, emoji }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message) return;

            // Add/update reaction
            const existingReactionIndex = message.reactions.findIndex(
                (r) => r.reactor.toString() === reactorId
            );
            if (existingReactionIndex !== -1) {
                message.reactions[existingReactionIndex].emoji = emoji;
            } else {
                message.reactions.push({ reactor: reactorId, emoji });
            }
            await message.save();

            // Emit to all members of the chat
            io.to(message.chat.toString()).emit('new_reaction', { messageId, reactorId, emoji, chat: message.chat });
        } catch (error) {
            console.error('Error adding reaction via socket:', error);
        }
    });


    // User disconnects
    socket.off('setup', () => {
        console.log('User disconnected from setup');
        socket.leave(userData._id);
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        let disconnectedUserId = null;
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }

        if (disconnectedUserId) {
            onlineUsers.delete(disconnectedUserId);
            // Update user status in DB
            await User.findByIdAndUpdate(disconnectedUserId, { status: 'offline', lastSeen: new Date() });
            io.emit('user_offline', disconnectedUserId); // Notify all clients
            console.log(`User ${disconnectedUserId} went offline.`);
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
