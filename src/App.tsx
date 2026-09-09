import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ENV } from './config/env';
import { initMockStorage } from './api/storage';
import { authApi } from './api/auth';
import { usersApi } from './api/users';
import { useAuthStore } from './store/useAuthStore';

function App() {
  useEffect(() => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
    }

    const token = useAuthStore.getState().token;
    if (token) {
      const loadProfile = ENV.ENABLE_MOCK_API ? authApi.getProfile() : usersApi.getProfile();
      loadProfile
        .then((user) => useAuthStore.getState().completeHydration(user))
        .catch(() => useAuthStore.getState().logout());
    }
  }, []);

  return (
    <RouterProvider router={router} />
  );
}

export default App;
