/// <reference types="cypress" />

describe('Sale-card authentication backdrop (HTTP fixtures)', () => {
  const items = [
    { id: 'a', name: 'Available A', status: 'SHOW', stock: 2, image: '/e2e-card-a.svg' },
    { id: 'a-copy', name: 'Same art', status: 'SHOW', stock: 3, image: '/e2e-card-a.svg' },
    { id: 'b', name: 'Available B', status: 'SHOW', stock: 1, image: '/e2e-card-b.svg' },
    { id: 'hidden', status: 'HIDE', stock: 2, image: '/hidden.svg' },
    { id: 'empty', status: 'SHOW', stock: 0, image: '/sold-out.svg' },
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/e2e-card-*.svg', { headers: { 'content-type': 'image/svg+xml' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="144" height="200"><rect width="144" height="200" fill="#72A8FF"/></svg>' });
    cy.intercept('GET', '**/api/products*', { items }).as('saleCards');
  });

  it('uses available listing images, animates continuously and reuses data across auth routes', () => {
    cy.viewport(1280, 900);
    cy.visit('/login');
    cy.wait('@saleCards');
    cy.get('[data-testid="auth-card-backdrop"]:visible .auth-sale-group img').should('have.length', 32).each(($img) => {
      expect(['/e2e-card-a.svg', '/e2e-card-b.svg']).to.include($img.attr('src'));
    });
    cy.get('[data-testid="auth-card-backdrop"]:visible .auth-sale-track').first().should('have.css', 'animation-name', 'auth-sale-drift');
    cy.get('[data-testid="auth-card-backdrop"]:visible .auth-sale-track').first().then(($track) => {
      const first = $track.css('transform');
      cy.wrap($track).should(($moving) => { expect($moving.css('transform')).not.to.equal(first); });
    });
    cy.contains('a', 'Sign up').click();
    cy.get('h1').should('have.text', 'Create account');
    cy.get('@saleCards.all').should('have.length', 1);
    cy.document().should((doc) => { expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth); });
  });

  it('keeps the fallback and usable login form when listings are unavailable', () => {
    cy.intercept('GET', '**/api/products*', { statusCode: 503, body: {} });
    cy.visit('/login');
    cy.get('[data-testid="auth-card-backdrop"]:visible [data-testid="auth-card-fallback"]').should('exist');
    cy.get('form button[type="submit"]').should('be.enabled');
    cy.get('input[name="remember-me"]').check().should('be.checked');
  });

  it('shows one static card row on mobile with reduced motion and no horizontal overflow', () => {
    cy.viewport(375, 812);
    cy.visit('/login', { onBeforeLoad(win) {
      const nativeMatch = win.matchMedia.bind(win);
      cy.stub(win, 'matchMedia').callsFake((query: string) => {
        const result = nativeMatch(query);
        if (query.includes('prefers-reduced-motion')) Object.defineProperty(result, 'matches', { value: true });
        return result;
      });
    } });
    cy.wait('@saleCards');
    cy.get('[data-testid="auth-card-backdrop"]:visible .auth-sale-track').should('have.length', 1).and('have.css', 'animation-name', 'none');
    cy.get('footer').should('not.be.visible');
    cy.document().should((doc) => { expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth); });
  });
});
