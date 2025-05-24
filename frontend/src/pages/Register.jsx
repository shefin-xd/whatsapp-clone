// frontend/src/pages/Register.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (username, email, password) => {
        await register(username, email, password);
        navigate('/'); // Redirect to home/chat after successful registration
    };

    return <AuthForm type="register" onSubmit={handleRegister} />;
};

export default Register;
