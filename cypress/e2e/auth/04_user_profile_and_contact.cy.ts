/// <reference types="cypress" />

describe('Auth Journey 4: User Profile & Contact Information Management (US-08-1)', () => {
  beforeEach(() => {
    cy.loginByMock('CUSTOMER');
  });

  it('keeps a non-remembered login in session storage after saving a profile and reloading', () => {
    cy.intercept('PUT', '**/users/profile', {
      statusCode: 200,
      body: { id: '1', name: 'Session Trainer', email: 'customer@mythix.com', role: 'USER', isSeller: false },
    }).as('saveSessionProfile');
    cy.visit('/profile/edit', {
      onBeforeLoad(win) {
        for (const key of ['token', 'tcg_auth_storage']) {
          const value = win.localStorage.getItem(key);
          if (value) win.sessionStorage.setItem(key, value);
          win.localStorage.removeItem(key);
        }
      },
    });
    cy.get('#name').clear().type('Session Trainer');
    cy.get('button[type="submit"]').click();
    cy.wait('@saveSessionProfile').its('request.headers.authorization').should('eq', 'Bearer mock-jwt-token-customer');
    cy.location('pathname').should('eq', '/profile');
    cy.reload();
    cy.location('pathname').should('eq', '/profile');
    cy.window().should((win) => {
      expect(win.sessionStorage.getItem('token')).to.equal('mock-jwt-token-customer');
      expect(win.localStorage.getItem('token')).to.equal(null);
      expect(win.localStorage.getItem('tcg_auth_storage')).to.equal(null);
    });
  });

  it('navigates to edit profile page, updates name and email, and saves successfully', () => {
    cy.visit('/profile/edit');
    cy.contains('Edit Profile').should('be.visible');
    
    cy.intercept('PUT', '**/users/profile', {
      statusCode: 200,
      body: { id: 'usr-1', name: 'Ash Ketchum Edited', email: 'buyer@mythix.com', role: 'CUSTOMER' }
    }).as('updateProfile');

    cy.get('#name').clear().type('Ash Ketchum Edited');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@updateProfile');
    // Redirects to profile and shows updated name
    cy.url().should('eq', Cypress.config().baseUrl + '/profile');
    cy.contains('h1', 'Ash Ketchum Edited').should('be.visible');
  });

  it('navigates to edit contact page, updates contact methods, and saves successfully', () => {
    cy.visit('/profile/edit/contact');
    cy.contains('Edit Contact Information').should('be.visible');

    cy.intercept('PUT', '**/users/profile', {
      statusCode: 200,
      body: { id: 'usr-1', name: 'Ash Ketchum', email: 'buyer@mythix.com', role: 'CUSTOMER', phone: '0812345678', line: 'ash_ketchum_new' }
    }).as('updateContact');

    cy.get('#phone').clear().type('0812345678');
    cy.get('#line').clear().type('ash_ketchum_new');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@updateContact');
    
    // Redirects to profile and shows updated info
    cy.url().should('eq', Cypress.config().baseUrl + '/profile');
    cy.contains('0812345678').should('be.visible');
    cy.contains('ash_ketchum_new').should('be.visible');
  });

  it('discards changes when clicking Cancel or Back', () => {
    cy.visit('/profile/edit');
    cy.get('#name').clear().type('Should Not Save');
    cy.contains('Back to profile').click();
    
    cy.url().should('eq', Cypress.config().baseUrl + '/profile');
    cy.contains('Should Not Save').should('not.exist');
  });

  it('displays API error message when saving fails', () => {
    cy.visit('/profile/edit');
    cy.get('#name').clear().type('Ash Ketchum Edited');
    
    // Intercept and force failure
    cy.intercept('PUT', '**/api/users/profile', {
      statusCode: 500,
      body: { message: 'Internal Server Error' }
    }).as('saveProfileError');

    cy.get('button[type="submit"]').click();
    cy.wait('@saveProfileError');
    
    // Assert error message according to US-08-1
    cy.contains('Unable to save profile. Please try again.').should('be.visible');
  });
});
