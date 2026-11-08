import type { RouteObject } from 'react-router-dom';
import { AnimatedAuthLayout } from './layouts/AnimatedAuthLayout';

export const authRoutes: RouteObject[] = [
  {
    element: <AnimatedAuthLayout />,
    children: [
      {
        path: 'login',
        lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }),
      },
      {
        path: 'register',
        lazy: async () => ({ Component: (await import('./pages/SignUpPage')).SignUpPage }),
      },
    ],
  },
  {
    path: 'forgot-password',
    lazy: async () => ({ Component: (await import('./pages/ForgotPasswordPage')).ForgotPasswordPage }),
  },
  {
    path: 'check-email',
    lazy: async () => ({ Component: (await import('./pages/CheckEmailPage')).CheckEmailPage }),
  },
  {
    path: 'reset-password',
    lazy: async () => ({ Component: (await import('./pages/ResetPasswordPage')).ResetPasswordPage }),
  },
  {
    path: 'reset-success',
    lazy: async () => ({ Component: (await import('./pages/ResetSuccessPage')).ResetSuccessPage }),
  },
];
