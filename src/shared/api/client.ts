import axios from 'axios';
import { ENV } from '@/shared/config/env';

interface ApiClientAuthHooks {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
}

let authHooks: ApiClientAuthHooks = {
  getAccessToken: () => localStorage.getItem('token'),
  onUnauthorized: () => localStorage.removeItem('token'),
};

export function configureApiClientAuth(hooks: ApiClientAuthHooks) {
  authHooks = hooks;
}

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = authHooks.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      authHooks.onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
