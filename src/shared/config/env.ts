/**
 * Centralized Environment Configuration for tcg-store-frontend
 */
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Mythix TCG Trading',
  PORT: Number(import.meta.env.VITE_PORT) || 5173,
} as const;

export type Environment = typeof ENV;
