import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import AuthContext from './context/AuthContext';
import io from 'socket.io-client';

const socket = io('https://shefin-whatsapp-clone.onrender.com', {
    transports: ['websocket', 'polling']
});

function App() {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setCurrentUser(JSON.parse(userInfo));
        }
    }, []);

    const login = (user) => {
        localStorage.setItem('userInfo', JSON.stringify(user));
        setCurrentUser(user);
    };

    const logout = () => {
        // Emit disconnect event before clearing local storage
        if (currentUser && socket) {
            socket.emit('disconnect_user', currentUser._id);
        }
        localStorage.removeItem('userInfo');
        setCurrentUser(null);
        // Disconnect socket manually if needed, or let the 'disconnect' event handle it
        socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            <Router>
                <div className="min-h-screen flex flex-col">
                    <Routes>
                        <Route path="/" element={currentUser ? <Navigate to="/chats" /> : <Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/chats"
                            element={currentUser ? <ChatPage socket={socket} /> : <Navigate to="/" />}
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;
