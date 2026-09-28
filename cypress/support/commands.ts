/// <reference types="cypress" />

// Custom command to bypass or mock authentication
Cypress.Commands.add('loginByMock', (role = 'CUSTOMER') => {
  const token = role === 'SELLER' ? 'mock-jwt-token-seller' : 'mock-jwt-token-customer';
  window.localStorage.setItem('token', token);
  window.localStorage.setItem(
    'tcg_auth_storage',
    JSON.stringify({
      state: {
        token,
        user: {
          id: role === 'SELLER' ? '2' : '1',
          email: `${role.toLowerCase()}@mythix.com`,
          fullName: `Test ${role}`,
          role: role === 'ADMIN' ? 'ADMIN' : 'USER',
          isSeller: role === 'SELLER',
        },
        isAuthenticated: true,
      },
      version: 0,
    })
  );
});

// Helper command to fast-forward order status via Seller API without switching UI accounts
Cypress.Commands.add('sellerFastForwardOrder', (orderId: string, status = 'FULFILLED') => {
  // Try authenticating with backend API or use mock token
  cy.request({
    method: 'POST',
    url: 'http://localhost:8080/api/auth/login',
    body: {
      email: 'seller@mythix.com',
      password: 'password123',
    },
    failOnStatusCode: false,
  }).then((loginRes) => {
    const sellerToken = loginRes.status === 200 ? loginRes.body.token : 'mock-jwt-token-seller';

    // Call seller update status endpoint
    cy.request({
      method: 'PATCH',
      url: `http://localhost:8080/api/seller/orders/${orderId}/status`,
      headers: {
        Authorization: `Bearer ${sellerToken}`,
      },
      body: { status },
      failOnStatusCode: false,
    });
  });
});

// Helper command for test data cleanup / teardown
Cypress.Commands.add('cleanTestOrder', (orderId: string | number) => {
  if (orderId) {
    // 1. Run database cleanup task for local postgres container
    cy.task('cleanupLocalDbOrder', orderId);
  }
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginByMock(role?: string): Chainable<void>;
      sellerFastForwardOrder(orderId: string, status?: string): Chainable<void>;
      cleanTestOrder(orderId: string | number): Chainable<void>;
    }
  }
}

