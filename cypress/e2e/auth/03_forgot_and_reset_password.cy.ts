/// <reference types="cypress" />

describe('Auth Journey 3: Forgot Password & Password Reset Flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('renders forgot password page with email input and submit button', () => {
    cy.visit('/forgot-password');
    cy.contains('Forgot Password').should('be.visible');
    cy.get('#email').should('be.visible').and('have.attr', 'type', 'email');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Send Reset Link');
    cy.contains('Remember your password?').should('be.visible');
    cy.get('main').contains('a', /^Login$/).should('be.visible').and('have.attr', 'href', '/login');
  });

  it('offers a new link when the reset link has no token', () => {
    cy.visit('/reset-password');
    cy.contains('Reset Link Unavailable').should('be.visible');
    cy.contains('a', 'Request a new link').should('have.attr', 'href', '/forgot-password');
  });

  it('renders reset password form when the URL contains a token', () => {
    cy.visit('/reset-password?token=test-token');
    cy.url().should('include', '/reset-password');
    cy.contains('Reset Password').should('be.visible');
    cy.get('#new-password').should('be.visible');
    cy.get('#confirm-password').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Reset Password');
  });

  it('validates password mismatch on reset password page', () => {
    cy.visit('/reset-password?token=test-token');

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
