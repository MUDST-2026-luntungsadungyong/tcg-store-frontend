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

// Auth & Account Custom Commands
Cypress.Commands.add('loginByUI', (email: string, password = 'password123') => {
  cy.visit('/login');
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('registerNewUser', (name: string, email: string, password = 'Password123!') => {
  cy.visit('/register');
  cy.get('#name').clear().type(name);
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.get('#confirm-password').clear().type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('requestPasswordReset', (email: string) => {
  cy.visit('/forgot-password');
  cy.get('#email').clear().type(email);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('updateProfileName', (name: string) => {
  cy.visit('/profile/edit');
  cy.get('#name').clear().type(name);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('updateProfileContact', (contact: { phone?: string; line?: string; facebook?: string }) => {
  cy.visit('/profile/edit/contact');
  if (contact.phone !== undefined) cy.get('#phone').clear().type(contact.phone);
  if (contact.line !== undefined) cy.get('#line').clear().type(contact.line);
  if (contact.facebook !== undefined) cy.get('#facebook').clear().type(contact.facebook);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginByUI('admin@mythix.com', 'admin123');
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginByMock(role?: string): Chainable<void>;
      sellerFastForwardOrder(orderId: string, status?: string): Chainable<void>;
      cleanTestOrder(orderId: string | number): Chainable<void>;
      loginByUI(email: string, password?: string): Chainable<void>;
      registerNewUser(name: string, email: string, password?: string): Chainable<void>;
      requestPasswordReset(email: string): Chainable<void>;
      updateProfileName(name: string): Chainable<void>;
      updateProfileContact(contact: { phone?: string; line?: string; facebook?: string }): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
    }
  }
}


