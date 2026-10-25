import axios from 'axios';
import { ENV } from '@/shared/config/env';
import { clearStoredAuth, getStoredAccessToken } from './authStorage';

interface ApiClientAuthHooks {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
}

let authHooks: ApiClientAuthHooks = {
  getAccessToken: getStoredAccessToken,
  onUnauthorized: clearStoredAuth,
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
    const token = authHooks.getAccessToken();
    const isMockToken = Boolean(token?.startsWith('mock-'));
    if (error.response?.status === 401 && !ENV.ENABLE_MOCK_API && !isMockToken) {
      authHooks.onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
