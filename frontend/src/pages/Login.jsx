// frontend/src/pages/Login.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (email, password) => {
        await login(email, password);
        navigate('/'); // Redirect to home/chat after successful login
    };

    return <AuthForm type="login" onSubmit={handleLogin} />;
};

export default Login;
