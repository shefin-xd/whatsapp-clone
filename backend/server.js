require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow your frontend to connect
        methods: ['GET', 'POST'],
    },
});

// Connect to Database
connectDB();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));

// Routes
app.use('/api/auth', authRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Socket.io connection (basic example for now)
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // You'll add more socket event handling here later
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
