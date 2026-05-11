import axios from 'axios';

const api = axios.create({
    baseURL: '/kiam/public/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

// Add a request interceptor to attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('kiam_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle 401s
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('kiam_token');
        localStorage.removeItem('kiam_user');
        window.location.href = '/kiam/public/login';
    }
    return Promise.reject(error);
});

export default api;
