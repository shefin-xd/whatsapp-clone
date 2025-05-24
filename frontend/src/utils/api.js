// frontend/src/utils/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://shefin-whatsapp-clone.onrender.com/api', // Your backend API base URL
});

export default api;
