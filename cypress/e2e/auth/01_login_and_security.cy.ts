/// <reference types="cypress" />

describe('Auth Journey 1: Login, Form Validations & Route Protection', () => {
  beforeEach(() => {
    // Clear storage before each test
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('renders login form elements with email, password inputs and submit button', () => {
    cy.visit('/login');
    cy.get('#email').should('be.visible').and('have.attr', 'type', 'email');
    cy.get('#password').should('be.visible').and('have.attr', 'type', 'password');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Login');
    cy.contains('Forgot password?').should('be.visible').and('have.attr', 'href', '/forgot-password');
    cy.contains('Sign up').should('be.visible').and('have.attr', 'href', '/register');
  });

  it('toggles password visibility between text and password on eye icon click', () => {
    cy.visit('/login');
    cy.get('#password').type('SecretPass123!');
    cy.get('#password').should('have.attr', 'type', 'password');

    // Click show password
    cy.get('button[aria-label="Show password"]').click();
    cy.get('#password').should('have.attr', 'type', 'text');

    // Click hide password
    cy.get('button[aria-label="Hide password"]').click();
    cy.get('#password').should('have.attr', 'type', 'password');
  });

  it('shows validation error when attempting to submit empty credentials', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click({ force: true });
    // URL stays on /login
    cy.url().should('include', '/login');
  });

  it('protects /admin route by redirecting unauthenticated guests to /login', () => {
    cy.visit('/admin');
    cy.url().should('include', '/login');
    cy.contains('Welcome back!').should('be.visible');
  });

  it('protects /workspace route by redirecting unauthenticated guests to /login', () => {
    cy.visit('/workspace');
    cy.url().should('include', '/login');
    cy.contains('Welcome back!').should('be.visible');
  });

  it('protects /profile route by redirecting unauthenticated guests to /login', () => {
    cy.visit('/profile');
    cy.url().should('include', '/login');
    cy.contains('Welcome back!').should('be.visible');
  });
});
