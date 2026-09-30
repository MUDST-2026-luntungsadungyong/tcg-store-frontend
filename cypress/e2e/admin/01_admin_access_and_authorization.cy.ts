/// <reference types="cypress" />

describe('US-11-1: Platform Admin Access & Authorization', () => {
  beforeEach(() => {
    // Intercept to avoid real api calls if needed, or rely on mock API enabled
    cy.clearLocalStorage();
    cy.clearCookies();
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
