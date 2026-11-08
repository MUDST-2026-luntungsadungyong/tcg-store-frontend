describe('Responsive marketplace navigation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/', { onBeforeLoad(win) { win.sessionStorage.clear(); } });
  });

  it('shows marketplace links in a dismissible mobile drawer', () => {
    cy.viewport(375, 812);
    cy.get('[aria-label="Open account menu"]').should('not.exist');
    cy.get('[aria-label="Open navigation menu"]').click();
    cy.get('dialog[open]').should('be.visible').should(($drawer) => {
      const box = $drawer[0].getBoundingClientRect();
      expect(box.left).to.be.closeTo(0, 1);
      expect(box.right).to.be.at.most($drawer[0].ownerDocument.defaultView!.innerWidth);
    }).within(() => {
      cy.get('nav a[href="/"]').should('have.attr', 'aria-current', 'page');
      cy.get('nav a[href="/auctions"]').should('be.visible').and('contain.text', 'Auctions');
      cy.get('a[href="/login"]').should('be.visible').and('contain.text', 'Log In');
      cy.get('[aria-label="Close navigation menu"]').click();
    });
    cy.get('dialog').should('have.css', 'display', 'none');
    cy.get('[aria-label="Open navigation menu"]').should('have.focus').click();
    cy.get('dialog[open] nav a[href="/cards"]').click();
    cy.location('pathname').should('eq', '/cards');
    cy.contains('h1', 'The Pokémon Cards Collection').should('be.visible');
    cy.get('dialog').should('have.css', 'display', 'none');
    cy.get('[aria-label="Open navigation menu"]').click();
    cy.get('dialog[open] nav a[href="/cards"]').should('have.attr', 'aria-current', 'page');
    cy.get('dialog[open] [aria-label="Close navigation menu"]').click();
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
      cy.contains('a', /^Listings$/).should('have.attr', 'href', '/workspace/listings');
      cy.contains('a', /^Seller Orders$/).should('have.attr', 'href', '/workspace/orders');
    });
    cy.viewport(1280, 900);
    cy.get('dialog').should('not.have.attr', 'open');
    cy.get('[aria-label="Open navigation menu"]').should('not.be.visible');
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
      cy.reload();
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
      cy.get('dialog[open]').contains('button', /log\s*out/i).scrollIntoView().should('be.visible').click();
      // Logout must leave the protected profile, regardless of a home/sign-in redirect.
      cy.location('pathname').should('not.eq', '/profile');
      cy.get('dialog').should('not.have.attr', 'open');
      cy.window().should((win) => {
        for (const storage of [win.localStorage, win.sessionStorage]) {
          expect(storage.getItem('token')).to.equal(null);
          expect(storage.getItem('tcg_auth_storage')).to.equal(null);
        }
      });
      cy.go('back');
      cy.location('pathname').should('eq', '/login');
      cy.get('#email').should('be.visible');
      cy.get('nav[aria-label="Marketplace navigation"] > div a[aria-label="Mythix home"]').filter(':visible').click();
      cy.location('pathname').should('eq', '/');
      cy.get('[aria-label="Open navigation menu"]').click();
      cy.get('dialog[open]').within(() => {
        cy.get('a[href="/login"]').should('be.visible').and('contain.text', 'Log In');
        cy.contains('button', /log\s*out/i).should('not.exist');
        cy.get('a[href="/workspace/listings"]').should('not.exist');
        cy.get('a[href="/admin"]').should('not.exist');
      });
    });
  }

});
