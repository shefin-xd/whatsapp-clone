// frontend/src/utils/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api', // Your backend API base URL
});

export default api;
