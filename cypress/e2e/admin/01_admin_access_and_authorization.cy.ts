/// <reference types="cypress" />

describe('US-11-1: Platform Admin Access & Authorization', () => {
  beforeEach(() => {
    // Intercept to avoid real api calls if needed, or rely on mock API enabled
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Prevent 401s from real backend for unmocked APIs (using strict host matching to avoid intercepting Vite .ts assets)
    cy.intercept('GET', 'http://localhost:8080/api/notifications*', { statusCode: 200, body: { content: [] } });
    cy.intercept('GET', 'http://localhost:8080/api/collections/leaderboard*', { statusCode: 200, body: [] });
    cy.intercept('GET', 'http://localhost:8080/api/admin/metrics*', { statusCode: 200, body: {} });
    cy.intercept('GET', 'http://localhost:8080/api/admin/dashboard*', { statusCode: 200, body: {} });
    cy.intercept('GET', 'http://localhost:8080/api/admin/orders*', { statusCode: 200, body: { content: [] } });
    cy.intercept('GET', 'http://localhost:8080/api/admin/audit-logs*', { statusCode: 200, body: { content: [] } });
    cy.intercept('GET', 'http://localhost:8080/api/admin/users*', { statusCode: 200, body: [] });

    cy.intercept('POST', 'http://localhost:8080/api/auth/login', (req) => {
      const { email, password } = req.body || {};
      if (password === 'wrongpassword') {
        req.reply({ statusCode: 401, body: { message: 'Invalid credentials' } });
      } else if (email === 'admin@mythix.com') {
        req.reply({
          statusCode: 200,
          body: {
            token: 'mock-jwt-token-admin',
            user: { id: '99', name: 'Admin Demo', email: 'admin@mythix.com', role: 'ADMIN' },
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            token: 'mock-jwt-token-customer',
            user: { id: '1', name: 'Ash Ketchum', email: 'ash@mythix.com', role: 'USER' },
          },
        });
      }
    }).as('loginApi');

    cy.intercept('GET', 'http://localhost:8080/api/users/profile', (req) => {
      const authHeader = String(req.headers['authorization'] || '');
      const isAdmin = authHeader.includes('admin');
      req.reply({
        statusCode: 200,
        body: {
          id: isAdmin ? '99' : '1',
          name: isAdmin ? 'Admin Demo' : 'Ash Ketchum',
          email: isAdmin ? 'admin@mythix.com' : 'ash@mythix.com',
          role: isAdmin ? 'ADMIN' : 'USER',
        },
      });
    }).as('profileApi');
  });

  it('should redirect non-authenticated user trying to access /admin to /login', () => {
    cy.visit('/admin');
    cy.url().should('include', '/login');
  });

  it('should redirect user without ADMIN role to / (Home) if trying to access /admin', () => {
    // Login as a normal USER
    cy.loginByUI('ash@mythix.com', 'password123');
    
    // Wait for login to finish and redirect to home
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    cy.visit('/admin');
    // Guard should prevent access and redirect to home
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should allow user with ADMIN role to access /admin and see Admin Layout', () => {
    // Login as ADMIN
    cy.loginAsAdmin();
    
    // After login, visit the admin dashboard explicitly
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    
    // Verify Admin Layout & Sidebar presence
    cy.get('nav').should('exist'); // Adjust selector if you have specific sidebar class like .admin-sidebar
    // Check for some admin text indicating successful access
    cy.contains(/admin|dashboard/i).should('be.visible');
  });
  
  it('should show error on login failure', () => {
    cy.visit('/login');
    cy.get('#email').clear().type('admin@mythix.com');
    cy.get('#password').clear().type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Assuming the error is shown in the UI
    cy.contains(/Invalid credentials|incorrect|Login failed/i).should('be.visible');
  });
});
