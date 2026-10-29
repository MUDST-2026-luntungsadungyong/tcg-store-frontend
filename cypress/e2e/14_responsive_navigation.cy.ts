describe('Responsive marketplace navigation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/', { onBeforeLoad(win) { win.sessionStorage.clear(); } });
  });

  it('shows mobile tabs and a dismissible account drawer', () => {
    cy.viewport(375, 812);
    cy.get('[aria-label="Mobile primary navigation"]').should('be.visible').then(($nav) => {
      const box = $nav[0].getBoundingClientRect();
      expect(box.left).to.be.greaterThan(0);
      expect(box.bottom).to.be.lessThan($nav[0].ownerDocument.defaultView!.innerHeight);
    });
    cy.get('[aria-label="Open account menu"]').should('not.exist');
    cy.get('[aria-label="Mobile primary navigation"] a[href="/"]').should('have.attr', 'aria-current', 'page');
    cy.get('[aria-label="Open navigation menu"]').click();
    cy.get('dialog[open]').within(() => {
      cy.contains('a', 'Login').should('be.visible');
      cy.get('[aria-label="Close navigation menu"]').click();
    });
    cy.get('dialog').should('not.have.attr', 'open');
    cy.get('[aria-label="Mobile primary navigation"] a[href="/cards"]').click();
    cy.location('pathname').should('eq', '/cards');
    cy.get('[aria-label="Mobile primary navigation"] a[href="/cards"]').should('have.attr', 'aria-current', 'page');
    cy.window().then((win) => { expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth); });
  });

  it('keeps seller links in the drawer and a compact desktop avatar', () => {
    cy.loginByMock('SELLER');
    cy.reload();
    cy.viewport(390, 844);
    cy.get('[aria-label="Open account menu"]').should('not.be.visible');
    cy.get('[aria-label="Open navigation menu"]').click();
    cy.get('dialog[open]').within(() => {
      cy.contains('SELLER').should('be.visible');
      cy.contains('a', 'Profile').should('be.visible');
      cy.contains('a', 'Workspace').should('have.attr', 'href', '/workspace/listings');
      cy.contains('a', 'Store Profile').should('have.attr', 'href', '/workspace/store-settings');
    });
    cy.viewport(1280, 900);
    cy.get('dialog').should('not.have.attr', 'open');
    cy.get('[aria-label="Mobile primary navigation"]').should('not.be.visible');
    cy.get('[aria-label="Open account menu"]').should('be.visible').should('contain', 'SELLER').should('not.contain', 'Test SELLER').click();
    cy.get('[role="menu"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[role="menu"]').should('not.exist');
    cy.viewport(768, 900);
    cy.window().then((win) => { expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth); });
  });

  for (const role of ['CUSTOMER', 'SELLER', 'ADMIN']) {
    it(`opens the mobile profile card and logs out a ${role.toLowerCase()}`, () => {
      cy.viewport(390, 844);
      cy.loginByMock(role);
      cy.window().should((win) => {
        const users = JSON.parse(win.localStorage.getItem('mythix_mock_users_v6')!);
        expect(users.find((user: { name: string }) => user.name === `Test ${role}`)).to.exist;
      });
      cy.visit('/');
      cy.get('[aria-label="Open navigation menu"]').click();
      cy.get('dialog[open]').should('be.visible').within(() => {
        cy.contains(`Test ${role}`).should('be.visible');
        cy.contains(role === 'CUSTOMER' ? 'COLLECTOR' : role).should('be.visible');
        cy.get('a[href="/profile"]').should('have.length', 1).click();
      });
      cy.location('pathname').should('eq', '/profile');
      cy.get('dialog').should('not.have.attr', 'open');
      cy.contains('h1', `Test ${role}`).should('be.visible');
      cy.get('[aria-label="Open navigation menu"]').click();
      cy.get('dialog[open]').contains('button', /^Logout$/).should('be.visible').click();
      // Logout must leave the protected profile, regardless of a home/sign-in redirect.
      cy.location('pathname').should('not.eq', '/profile');
      cy.get('dialog').should('not.have.attr', 'open');
      cy.window().should((win) => {
        for (const storage of [win.localStorage, win.sessionStorage]) {
          expect(storage.getItem('token')).to.equal(null);
          expect(storage.getItem('tcg_auth_storage')).to.equal(null);
        }
      });
      cy.visit('/profile');
      cy.location('pathname').should('eq', '/login');
      cy.get('#email').should('be.visible');
      cy.visit('/');
      cy.get('[aria-label="Open navigation menu"]').click();
      cy.get('dialog[open]').within(() => {
        cy.contains('a', /^Login$/).should('be.visible');
        cy.contains('button', /^Logout$/).should('not.exist');
        cy.get('a[href="/workspace/listings"]').should('not.exist');
        cy.get('a[href="/admin"]').should('not.exist');
      });
    });
  }

});
