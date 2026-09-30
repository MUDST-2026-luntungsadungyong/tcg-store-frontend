/// <reference types="cypress" />

describe('Auth Journey 3: Forgot Password & Password Reset Flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('renders forgot password page with email input and continue button', () => {
    cy.visit('/forgot-password');
    cy.contains('Forgot Password').should('be.visible');
    cy.get('#email').should('be.visible').and('have.attr', 'type', 'email');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Continue');
    cy.contains('Remember your password?').should('be.visible');
    cy.contains('Login').should('be.visible').and('have.attr', 'href', '/login');
  });

  it('redirects user to /forgot-password when visiting /reset-password without prior initiation', () => {
    // Attempting direct entry without demo reset session token
    cy.visit('/reset-password');
    cy.url().should('include', '/forgot-password');
    cy.contains('Forgot Password').should('be.visible');
  });

  it('renders reset password form when reset session is active', () => {
    // Establish pending demo reset session
    window.sessionStorage.setItem('mythix_demo_reset_email', 'buyer@mythix.com');
    cy.visit('/reset-password');
    cy.url().should('include', '/reset-password');
    cy.contains('Reset Password').should('be.visible');
    cy.get('#new-password').should('be.visible');
    cy.get('#confirm-password').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Reset Password');
  });

  it('validates password mismatch on reset password page', () => {
    window.sessionStorage.setItem('mythix_demo_reset_email', 'buyer@mythix.com');
    cy.visit('/reset-password');

    cy.get('#new-password').type('NewStrongPass123!');
    cy.get('#confirm-password').type('MismatchPass123!');
    cy.get('button[type="submit"]').click();

    cy.contains('Passwords do not match').should('be.visible');
    cy.url().should('include', '/reset-password');
  });

  it('renders reset success page and allows user to proceed to login', () => {
    cy.visit('/reset-success');
    cy.get('body').should('be.visible');
    cy.contains('Password Changed Successfully').should('be.visible');
    cy.contains('Go to Login').should('be.visible').click();
    cy.url().should('include', '/login');
  });
});
