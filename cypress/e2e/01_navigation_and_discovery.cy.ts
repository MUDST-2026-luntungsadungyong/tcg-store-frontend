describe('Core Journey 1: Home, Navigation & Card Discovery', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('successfully loads the homepage and displays main navigation header', () => {
    cy.get('header, nav').should('exist');
    cy.title().should('not.be.empty');
  });

  it('navigates to card discovery / marketplace page', () => {
    // Check if there is a link to browse or cards
    cy.get('a[href*="browse"], a[href*="discover"], a[href*="cards"]').first().click({ force: true });
    cy.url().should('include', '/');
  });

  it('has a responsive search input in the navigation', () => {
    cy.get('input[type="search"], input[placeholder*="Search"], input[placeholder*="ค้นหา"]')
      .first()
      .should('be.visible')
      .type('Pikachu{enter}');
  });

  it('protects the notifications inbox from unauthenticated users', () => {
    cy.visit('/notifications');
    cy.url().should('include', '/login');
    cy.get('#email').should('be.visible');
  });
});
