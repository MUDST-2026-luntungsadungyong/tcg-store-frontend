/// <reference types="cypress" />

// Custom command to bypass or mock authentication
Cypress.Commands.add('loginByMock', (role = 'CUSTOMER') => {
  window.localStorage.setItem(
    'tcg_auth_storage',
    JSON.stringify({
      state: {
        token: 'mock-jwt-token-12345',
        user: {
          id: 1,
          email: `${role.toLowerCase()}@tcg.com`,
          fullName: `Test ${role}`,
          role: role,
        },
        isAuthenticated: true,
      },
      version: 0,
    })
  );
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginByMock(role?: string): Chainable<void>;
    }
  }
}
