import axios from 'axios';

const api = axios.create({
    baseURL: 'https://shefin-whatsapp-clone.onrender.com/api',
});

// Request interceptor to add the authorization token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('userInfo')); // Get user info from localStorage
        const token = user ? user.token : null; // Extract the token

        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Attach the token
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
