import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage'; // Import ChatPage

// PrivateRoute component
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        // You might want a loading spinner here
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return user ? children : <Navigate to="/login" />;
};


const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <ChatPage /> {/* Our main chat application */}
                            </PrivateRoute>
                        }
                    />
                    {/* Add more routes as needed */}
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
