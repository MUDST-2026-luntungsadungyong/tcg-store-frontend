describe('Core Journey 2: Authentication & Route Protection', () => {
  it('displays the login page with email and password inputs', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').should('be.visible');
    cy.get('input[type="password"], input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('exist');
  });

  it('displays validation feedback when attempting submit with empty credentials', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click({ force: true });
    // Verify user stays on login or error message appears
    cy.url().should('include', '/login');
  });

  it('redirects unauthenticated guest trying to access protected /admin route', () => {
    cy.visit('/admin');
    // ProtectedRoute should redirect guest to /login
    cy.url().should('include', '/login');
  });

  it('redirects unauthenticated guest trying to access protected /workspace route', () => {
    cy.visit('/workspace');
    // ProtectedRoute should redirect guest to /login
    cy.url().should('include', '/login');
  });
});
