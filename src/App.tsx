import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ENV } from './config/env';
import { initMockStorage } from './api/storage';

function App() {
  useEffect(() => {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
    }
  }, []);

  return (
    <RouterProvider router={router} />
  );
}

export default App;
