import axios from 'axios';

const api = axios.create({
    baseURL: 'https://shefin-whatsapp-clone.onrender.com/api', // Ensure '/api' suffix is here
});

// Request interceptor to add the authorization token to every outgoing request
api.interceptors.request.use(
    (config) => {
        const userInfoString = localStorage.getItem('userInfo');
        let user = null;
        if (userInfoString) {
            try {
                user = JSON.parse(userInfoString);
            } catch (e) {
                console.error("Error parsing userInfo from localStorage:", e);
                localStorage.removeItem('userInfo'); // Clear corrupted data
            }
        }

        const token = user ? user.token : null;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
