// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
// ***********************************************************

import './commands';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// Provide default network intercepts so background calls (e.g. from Navbar)
// do not receive 401s from the backend and trigger unauthorized redirects
beforeEach(() => {
  const api = 'http://localhost:8080/api';

  cy.intercept('GET', `${api}/notifications/unread-count`, {
    statusCode: 200,
    body: { unreadCount: 0 },
  });

  cy.intercept('GET', `${api}/notifications*`, {
    statusCode: 200,
    body: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true },
  });

  cy.intercept('GET', `${api}/cart`, {
    statusCode: 200,
    body: { items: [], totalItems: 0, totalAmount: 0 },
  });
});

