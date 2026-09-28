/// <reference types="cypress" />

describe('Auth Journey 4: User Profile & Contact Information Management', () => {
  beforeEach(() => {
    // Authenticate user before visiting protected profile routes
    cy.loginByMock('CUSTOMER');
  });

  it('renders profile dashboard with personal information and contact cards', () => {
    cy.visit('/profile');
    cy.url().should('include', '/profile');
    cy.contains('My Profile').should('be.visible');

    // Sections
    cy.contains('Personal Information').should('be.visible');
    cy.contains('Contact Information').should('be.visible');

    // Links to sub-editors
    cy.contains('Edit profile').should('be.visible').and('have.attr', 'href', '/profile/edit');
    cy.contains('Edit contact').should('be.visible').and('have.attr', 'href', '/profile/edit/contact');
  });

  it('navigates to edit profile page and displays full name input', () => {
    cy.visit('/profile');
    cy.contains('Edit profile').click();
    cy.url().should('include', '/profile/edit');
    cy.contains('Edit Profile').should('be.visible');
    cy.get('#name').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Save changes');

    // Back button returns to /profile
    cy.contains('Back to profile').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/profile');
  });

  it('navigates to edit contact page and displays contact input fields', () => {
    cy.visit('/profile');
    cy.contains('Edit contact').click();
    cy.url().should('include', '/profile/edit/contact');
    cy.contains('Edit Contact Information').should('be.visible');

    cy.get('#phone').should('be.visible');
    cy.get('#line').should('be.visible');
    cy.get('#facebook').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Save contact info');

    // Back button returns to /profile
    cy.contains('Back to profile').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/profile');
  });

  it('redirects unauthenticated guest trying to access profile to /login', () => {
    // Clear credentials
    window.localStorage.clear();
    cy.visit('/profile');
    cy.url().should('include', '/login');
  });
});
