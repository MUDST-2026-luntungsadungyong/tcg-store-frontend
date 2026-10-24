/// <reference types="cypress" />

// Run in both in-browser mock mode and HTTP-fixture mode; no real accounts are used.
describe('Remember me and authentication session boundaries', () => {
  const buyer = { id: '1', name: 'Persistence Buyer', email: 'buyer@remember.test', role: 'USER', isSeller: false };
  const seller = { id: '2', name: 'Persistence Seller', email: 'seller@remember.test', role: 'USER', isSeller: true, sellerStatus: 'APPROVED' };
  const admin = { id: '99', name: 'Persistence Admin', email: 'admin@mythix.com', role: 'ADMIN', isSeller: false };
  const password = 'password123';

  function expectStorage(remember: boolean, token = 'mock-jwt-token-customer') {
    cy.window().should((win) => {
      const active = remember ? win.localStorage : win.sessionStorage;
      const inactive = remember ? win.sessionStorage : win.localStorage;
      expect(active.getItem('token')).to.equal(token);
      expect(JSON.parse(active.getItem('tcg_auth_storage')!).state.token).to.equal(token);
      expect(inactive.getItem('token')).to.equal(null);
      expect(inactive.getItem('tcg_auth_storage')).to.equal(null);
      for (const storage of [win.localStorage, win.sessionStorage]) {
        for (const key of ['token', 'tcg_auth_storage']) {
          expect(storage.getItem(key) ?? '').not.to.include(password);
        }
      }
    });
  }

  function expectGuestStorage() {
    cy.window().should((win) => {
      for (const storage of [win.localStorage, win.sessionStorage]) {
        expect(storage.getItem('token')).to.equal(null);
        expect(storage.getItem('tcg_auth_storage')).to.equal(null);
      }
    });
  }

  beforeEach(() => {
    cy.intercept('POST', '**/api/auth/login', (req) => {
      const user = [buyer, seller].find((candidate) => candidate.email === req.body.email);
      if (!user || req.body.password !== password) {
        req.reply({ statusCode: 401, body: { message: 'Invalid credentials' } });
        return;
      }
      req.reply({ token: user.isSeller ? 'mock-jwt-token-seller' : 'mock-jwt-token-customer', user });
    });
    cy.intercept('GET', '**/api/users/profile', (req) => {
      const token = String(req.headers.authorization);
      req.reply(token.includes('admin') ? admin : token.includes('seller') ? seller : buyer);
    });
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('mythix_mock_users_v6', JSON.stringify([buyer, seller, admin]));
      },
    });
  });

  for (const remember of [false, true]) {
    const mode = remember ? 'remembered' : 'tab-only';

    it(`${mode}: submits the real form and survives a protected-page reload`, () => {
      cy.loginByUI(buyer.email, password, remember);
      expectStorage(remember);
      cy.visit('/profile');
      cy.contains(buyer.name).should('be.visible');
      cy.reload();
      cy.location('pathname').should('eq', '/profile');
      cy.contains(buyer.name).should('be.visible');
      expectStorage(remember);
    });

    it(`${mode}: Logout clears both storage types and protects private routes`, () => {
      cy.loginByUI(buyer.email, password, remember);
      cy.window().then((win) => {
        const inactive = remember ? win.sessionStorage : win.localStorage;
        inactive.setItem('token', 'stale-other-store-token');
        inactive.setItem('tcg_auth_storage', JSON.stringify({ state: { token: 'stale-other-store-token', user: buyer } }));
      });
      cy.get('button[aria-label="Open account menu"]').click();
      cy.contains('button', /^Logout$/).click();
      cy.get('button[aria-label="Open account menu"]').should('not.exist');
      expectGuestStorage();
      cy.visit('/profile');
      cy.location('pathname').should('eq', '/login');
      expectGuestStorage();
    });

    it(`${mode}: a failed login never stores credentials`, () => {
      cy.get('#email').type(buyer.email);
      cy.get('#password').type('wrong-password', { log: false });
      if (remember) cy.get('input[name="remember-me"]').check();
      cy.get('form button[type="submit"]').click();
      cy.get('[role="alert"]').should('contain.text', 'Invalid credentials');
      cy.location('pathname').should('eq', '/login');
      expectGuestStorage();
    });

    it(`${mode}: simulates an ended tab session without removing remembered credentials`, () => {
      cy.loginByUI(buyer.email, password, remember);
      // Model the storage boundary explicitly; this is not a real browser-close test.
      cy.visit('/profile', { onBeforeLoad(win) { win.sessionStorage.clear(); } });
      cy.location('pathname').should('eq', remember ? '/profile' : '/login');
      if (remember) expectStorage(true);
      else expectGuestStorage();
    });
  }

  it('switches accounts and persistence modes without retaining previous credentials', () => {
    function switchThroughForm(email: string, remember: boolean) {
      // Do not use the clearing helper here: exercise the application's own replacement.
      cy.visit('/login');
      cy.get('#email').type(email);
      cy.get('#password').type(password, { log: false });
      if (remember) cy.get('input[name="remember-me"]').check();
      cy.get('form button[type="submit"]').click();
      cy.location('pathname').should('not.eq', '/login');
    }
    cy.loginByUI(buyer.email, password, false);
    expectStorage(false);
    switchThroughForm(seller.email, true);
    expectStorage(true, 'mock-jwt-token-seller');
    cy.visit('/profile');
    cy.contains(seller.name).should('be.visible');
    switchThroughForm(buyer.email, false);
    expectStorage(false);
    cy.visit('/profile');
    cy.contains(buyer.name).should('be.visible');
  });

  it('mock-login helper replaces a tab-only customer with the requested role', () => {
    cy.loginByUI(buyer.email, password, false);
    cy.loginByMock('ADMIN');
    cy.visit('/admin');
    cy.location('pathname').should('eq', '/admin');
    expectStorage(true, 'mock-jwt-token-admin');
  });

  it('guest helper removes auth from both stores and preserves unrelated app data', () => {
    cy.loginByUI(buyer.email, password, false);
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'stale-remembered-token');
      win.localStorage.setItem('tcg_auth_storage', '{}');
      win.localStorage.setItem('e2e-cart-sentinel', 'keep');
    });
    cy.clearAuthStorage();
    cy.visit('/profile');
    cy.location('pathname').should('eq', '/login');
    expectGuestStorage();
    cy.window().its('localStorage').invoke('getItem', 'e2e-cart-sentinel').should('eq', 'keep');
  });
});
