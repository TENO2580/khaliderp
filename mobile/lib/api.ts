import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

// Use EXPO_PUBLIC_API_URL from .env if available, otherwise fallback to the user's current known IP.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.180.136.141:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // 60 second timeout due to Supabase DB latency
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - force logout
      try {
        const logout = useAuthStore.getState().logout;
        if (logout) await logout();
      } catch (e) {
        console.error('Logout failed in interceptor', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
