import { defineStore } from 'pinia';
import api from '../plugins/axios';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('kiam_user') || sessionStorage.getItem('kiam_user')) || null,
        token: localStorage.getItem('kiam_token') || sessionStorage.getItem('kiam_token') || null,
    }),
    
    getters: {
        isAuthenticated: (state) => !!state.token,
        hasRole: (state) => (role) => {
            if (!state.user || !state.user.roles) return false;
            return state.user.roles.includes(role);
        }
    },
    
    actions: {
        async login(credentials) {
            try {
                const response = await api.post('/login', credentials);
                const { remember, ...loginData } = credentials;
                
                this.token = response.data.token;
                this.user = response.data.user;
                
                const storage = remember ? localStorage : sessionStorage;
                
                storage.setItem('kiam_token', this.token);
                storage.setItem('kiam_user', JSON.stringify(this.user));
                
                // If remembered, also store email for pre-filling (always in localStorage)
                if (remember) {
                    localStorage.setItem('kiam_remembered_email', credentials.email);
                } else {
                    localStorage.removeItem('kiam_remembered_email');
                }
                
                return { success: true };
            } catch (error) {
                return { 
                    success: false, 
                    message: error.response?.data?.message || 'Erreur de connexion'
                };
            }
        },
        
        async logout() {
            try {
                await api.post('/logout');
            } catch (error) {
                console.error('Logout error', error);
            } finally {
                this.user = null;
                this.token = null;
                localStorage.removeItem('kiam_token');
                localStorage.removeItem('kiam_user');
                sessionStorage.removeItem('kiam_token');
                sessionStorage.removeItem('kiam_user');
            }
        }
    }
});
