import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

export const getLeads = () => api.get('/leads');
export const getConversations = () => api.get('/conversations');
export const getConversation = (username) => api.get(`/conversations/${username}`);
export const toggleTakeover = (username, enable) => api.post(`/conversations/${username}/takeover?enable=${enable}`);
export const getLogs = () => api.get('/logs');
export const getSettings = (key) => api.get(`/settings/${key}`);
export const updateSettings = (key, value) => api.post(`/settings/${key}`, value);

export default api;
