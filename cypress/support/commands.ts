/// <reference types="cypress" />

function clearAuthStorage(win: Window) {
  for (const storage of [win.localStorage, win.sessionStorage]) {
    storage.removeItem('token');
    storage.removeItem('tcg_auth_storage');
  }
}

Cypress.Commands.add('clearAuthStorage', () => {
  // Storage-only fixture helper: visit/reload afterwards to rebuild the auth store.
  cy.window().then((win) => clearAuthStorage(win));
});

// Custom command to bypass or mock authentication
Cypress.Commands.add('loginByMock', (role = 'CUSTOMER') => {
  const token = role === 'ADMIN' ? 'mock-jwt-token-admin' : (role === 'SELLER' ? 'mock-jwt-token-seller' : 'mock-jwt-token-customer');
  const userObj = {
    id: role === 'ADMIN' ? '99' : (role === 'SELLER' ? '2' : '1'),
    email: `${role.toLowerCase()}@mythix.com`,
    name: `Test ${role}`,
    role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    isSeller: role === 'SELLER',
    sellerStatus: role === 'SELLER' ? 'APPROVED' : undefined
  };

  cy.intercept('GET', '**/auth/me', { statusCode: 200, body: userObj });
  cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: userObj });
  
  return cy.window().then((win) => {
    clearAuthStorage(win);
    win.localStorage.setItem('token', token);
    win.localStorage.setItem(
      'tcg_auth_storage',
      JSON.stringify({ state: { token, user: userObj, isAuthenticated: true }, version: 0 }),
    );

    const rawUsers = win.localStorage.getItem('mythix_mock_users_v6');
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    // Mock getProfile resolves the first account matching the token's role.
    // Prioritize this fixture so hydration cannot replace it with a default seed.
    win.localStorage.setItem('mythix_mock_users_v6', JSON.stringify([
      userObj,
      ...users.filter((user: { id: string }) => String(user.id) !== userObj.id),
    ]));
  });
});

// Helper command to fast-forward order status via Seller API without switching UI accounts
Cypress.Commands.add('sellerFastForwardOrder', (orderId: string, status = 'FULFILLED') => {
  cy.window().then((win) => {
    // Modify local storage directly for the mock API scenario
    const mockReservationsStr = win.localStorage.getItem('mythix_mock_reservations_v1');
    if (mockReservationsStr) {
      const mockReservations = JSON.parse(mockReservationsStr);
      const updated = mockReservations.map((order: any) => 
        order.id === orderId ? { ...order, status } : order
      );
      win.localStorage.setItem('mythix_mock_reservations_v1', JSON.stringify(updated));
    }
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
Cypress.Commands.add('loginByUI', (email: string, password = 'password123', rememberMe = false) => {
  cy.clearAuthStorage();
  cy.visit('/login');
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password, { log: false });
  if (rememberMe) cy.get('input[name="remember-me"]').check();
  else cy.get('input[name="remember-me"]').uncheck();
  cy.get('form').find('button[type="submit"]').should('have.length', 1).click();
  // Wait for login request to complete and redirect away from login page
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('registerNewUser', (name: string, email: string, password = 'Password123!') => {
  cy.visit('/register');
  cy.get('#name').clear().type(name);
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.get('#confirm-password').clear().type(password);
  cy.get('form').find('button[type="submit"]').should('have.length', 1).click();
  // Wait for redirect
  cy.url().should('not.include', '/register');
});

Cypress.Commands.add('requestPasswordReset', (email: string) => {
  cy.visit('/forgot-password');
  cy.get('#email').clear().type(email);
  cy.get('form').find('button[type="submit"]').should('have.length', 1).click();
});

Cypress.Commands.add('updateProfileName', (name: string) => {
  cy.visit('/profile/edit');
  cy.get('#name').clear().type(name);
  cy.get('form').find('button[type="submit"]').should('have.length', 1).click();
});

Cypress.Commands.add('updateProfileContact', (contact: { phone?: string; line?: string; facebook?: string }) => {
  cy.visit('/profile/edit/contact');
  if (contact.phone !== undefined) cy.get('#phone').clear().type(contact.phone);
  if (contact.line !== undefined) cy.get('#line').clear().type(contact.line);
  if (contact.facebook !== undefined) cy.get('#facebook').clear().type(contact.facebook);
  cy.get('form').find('button[type="submit"]').should('have.length', 1).click();
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginByUI('admin@mythix.com', 'admin123');
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});

declare global {
  namespace Cypress {
    interface Chainable {
      clearAuthStorage(): Chainable<void>;
      loginByMock(role?: string): Chainable<void>;
      sellerFastForwardOrder(orderId: string, status?: string): Chainable<void>;
      cleanTestOrder(orderId: string | number): Chainable<void>;
      loginByUI(email: string, password?: string, rememberMe?: boolean): Chainable<void>;
      registerNewUser(name: string, email: string, password?: string): Chainable<void>;
      requestPasswordReset(email: string): Chainable<void>;
      updateProfileName(name: string): Chainable<void>;
      updateProfileContact(contact: { phone?: string; line?: string; facebook?: string }): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
    }
  }
}


