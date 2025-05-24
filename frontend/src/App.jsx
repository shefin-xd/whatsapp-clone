// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';

// Placeholder for your main chat application component
const Home = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">Welcome, {user.username}!</h1>
            <p className="text-lg mb-6">This is your chat app home page. More features coming soon!</p>
            <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Logout
            </button>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Home />} /> {/* Protected route */}
                    {/* Add more routes for chat, groups, settings, etc. */}
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
