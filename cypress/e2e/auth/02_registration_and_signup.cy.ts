/// <reference types="cypress" />

describe('Auth Journey 2: New User Registration & Sign-Up Validation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('renders sign up form elements correctly', () => {
    cy.visit('/register');
    cy.get('#name').should('be.visible');
    cy.get('#email').should('be.visible').and('have.attr', 'type', 'email');
    cy.get('#password').should('be.visible');
    cy.get('#confirm-password').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Create account');
    cy.contains('Sign in').should('be.visible').and('have.attr', 'href', '/login');
  });

  it('shows password requirements checklist when focusing on password field', () => {
    cy.visit('/register');
    cy.get('#password').focus();
    cy.contains('At least 8 characters').should('be.visible');
    cy.contains('No more than 72 characters').should('be.visible');
    cy.contains('One uppercase letter').should('be.visible');
    cy.contains('One number').should('be.visible');
  });

  it('shows validation error when passwords do not match', () => {
    cy.visit('/register');
    cy.get('#name').type('New Trainer');
    cy.get('#email').type('trainer@mythix.com');
    cy.get('#password').type('StrongPass123!');
    cy.get('#confirm-password').type('DifferentPass123!');
    cy.get('button[type="submit"]').click();

    cy.contains('Passwords do not match').should('be.visible');
    cy.url().should('include', '/register');
  });

  it('shows validation error when password does not meet complexity requirements', () => {
    cy.visit('/register');
    cy.get('#name').type('Weak User');
    cy.get('#email').type('weak@mythix.com');
    cy.get('#password').type('12345');
    cy.get('#confirm-password').type('12345');
    cy.get('button[type="submit"]').click();

    cy.contains('Password does not meet the requirements').should('be.visible');
    cy.url().should('include', '/register');
  });

  it('allows user to navigate back to login page from registration', () => {
    cy.visit('/register');
    cy.contains('Sign in').click();
    cy.url().should('include', '/login');
  });
});
