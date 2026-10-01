import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { ENV } from '@/shared/config/env';
import { authApi } from '@/features/auth/api/auth';
import { profileApi } from '@/features/profile/api/profile';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { configureApiClientAuth } from '@/shared/api/client';
import { ToastProvider } from '@/shared/components/Toast';
import { initMockStorage } from '@/infrastructure/mock-db/storage';

configureApiClientAuth({
  getAccessToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().logout();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  },
});

if (ENV.ENABLE_MOCK_API) {
  initMockStorage();
}

function App() {
  useEffect(() => {
    let mounted = true;
    const token = useAuthStore.getState().token;
    if (token) {
      (ENV.ENABLE_MOCK_API ? authApi.getProfile() : profileApi.get())
        .then((user) => {
          if (mounted) useAuthStore.getState().completeHydration(user);
        })
        .catch(() => {
          if (mounted) useAuthStore.getState().logout();
        });
    }
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <ToastProvider />
    </>
  );
}

export default App;
