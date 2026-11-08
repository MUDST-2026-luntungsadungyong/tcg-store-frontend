/// <reference types="cypress" />

describe('Responsive authentication', () => {
  for (const [width, height] of [[375, 812], [430, 932], [812, 375], [768, 1024]]) {
    it(`keeps forms usable and navigation continuous at ${width}x${height}`, () => {
      cy.viewport(width, height);
      cy.visit('/login');
      cy.get('[aria-label="Mobile primary navigation"]').should('not.exist');
      cy.get('h1').should('contain.text', 'Welcome back!');
      cy.get('input[name="remember-me"]').should('not.be.checked').check().should('be.checked').uncheck();
      if (width < 768) {
        cy.get('h1').then(($heading) => {
          expect($heading[0].getBoundingClientRect().top).to.be.lessThan(height * 0.65);
        });
        cy.get('input[type="email"]').should('have.css', 'font-size', '16px');
        cy.get('footer').should('not.be.visible');
        cy.get('[data-testid="auth-form-panel"]').then(($panel) => {
          const bounds = $panel[0].getBoundingClientRect();
          expect(bounds.left).to.equal(0);
          expect(bounds.right).to.equal($panel[0].ownerDocument.documentElement.clientWidth);
          expect(bounds.bottom).to.be.closeTo(height, 1);
        });
      } else {
        cy.get('footer').should('be.visible');
      }
      cy.get('button[aria-label="Show password"]').then(($button) => {
        const bounds = $button[0].getBoundingClientRect();
        expect(bounds.width).to.be.at.least(44);
        expect(bounds.height).to.be.at.least(44);
      });
      cy.contains('a', 'Sign up').click();
      cy.get('h1').should('contain.text', 'Create account').and('have.focus');
      if (width < 768) cy.get('footer').should('not.be.visible');
      cy.get('#password').focus().type('weak');
      cy.contains('At least 8 characters').should('be.visible');
      cy.get('#confirm-password').scrollIntoView().should('be.visible');
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(width);
      });
      cy.contains('p a', 'Login').click();
      cy.get('h1').should('contain.text', 'Welcome back!').and('have.focus');
      cy.get('form button[type="submit"]').scrollIntoView().should('be.visible');
    });
  }

  it('supports reduced motion and enlarged text on a small phone', () => {
    cy.viewport(375, 812);
    cy.visit('/login', {
      onBeforeLoad(win) {
        const matchMedia = win.matchMedia.bind(win);
        cy.stub(win, 'matchMedia').callsFake((query: string) => {
          const result = matchMedia(query);
          if (query.includes('prefers-reduced-motion')) {
            Object.defineProperty(result, 'matches', { value: true });
          }
          return result;
        });
      },
    });
    cy.get('html').invoke('css', 'font-size', '24px');
    cy.contains('a', 'Sign up').click();
    cy.get('h1').should('contain.text', 'Create account').and('have.focus');
    cy.get('#password').focus();
    cy.contains('At least 8 characters').should('be.visible');
    cy.get('#confirm-password').scrollIntoView().should('be.visible');
    cy.get('form button[type="submit"]').scrollIntoView().should('be.visible');
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(375);
    });
  });
});
