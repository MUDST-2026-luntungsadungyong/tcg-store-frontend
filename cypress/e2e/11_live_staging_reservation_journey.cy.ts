/// <reference types="cypress" />

/**
 * This is deliberately separate from the mock-backed Cypress suite. It uses
 * real browser form submissions and a deployed API, so it is opt-in locally
 * and is run from the protected staging workflow only.
 */
const liveE2EEnabled = String(Cypress.expose('LIVE_E2E')).toLowerCase() === 'true';

function requiredEnv(name: string): string {
  const value = Cypress.expose(name);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing CYPRESS_${name}; see docs/e2e-staging-journey.md.`);
  }
  return value.trim();
}

function login(email: string, password: string) {
  cy.intercept('POST', '**/auth/login').as('loginRequest');
  cy.visit('/login');
  cy.get('#email').clear().type(email, { log: false });
  cy.get('#password').clear().type(password, { log: false });
  cy.get('form').contains('button', 'Login').click();
  cy.wait('@loginRequest').then(({ response }) => {
    cy.log(`login response: ${response?.statusCode ?? 'no response'}`);
  });
  cy.get('button[aria-label="Open account menu"]', { timeout: 15000 }).should('be.visible');
}

(liveE2EEnabled ? describe : describe.skip)('Live staging reservation journey', () => {
  let sellerEmail: string;
  let sellerPassword: string;
  let buyerEmail: string;
  let buyerPassword: string;
  let cardQuery: string;
  let apiBaseUrl: string;
  let backendDigest: string;

  before(() => {
    cy.env(['E2E_SELLER_EMAIL', 'E2E_SELLER_PASSWORD', 'E2E_BUYER_EMAIL', 'E2E_BUYER_PASSWORD'], { log: false }).then((values) => {
      for (const key of Object.keys(values)) {
        if (typeof values[key] !== 'string' || !values[key].trim()) throw new Error(`Missing CYPRESS_${key}`);
      }
      sellerEmail = values.E2E_SELLER_EMAIL;
      sellerPassword = values.E2E_SELLER_PASSWORD;
      buyerEmail = values.E2E_BUYER_EMAIL;
      buyerPassword = values.E2E_BUYER_PASSWORD;
    });
    cardQuery = requiredEnv('E2E_CARD_QUERY');
    apiBaseUrl = requiredEnv('API_BASE_URL').replace(/\/$/, '');
    backendDigest = requiredEnv('BACKEND_DIGEST');
    expect(backendDigest).to.match(/^sha256:[a-f0-9]{64}$/);

    // A public readiness endpoint proves this run is using the supplied
    // staging API, rather than accidentally talking to localhost.
    const serviceOrigin = apiBaseUrl.replace(/\/api$/, '');
    cy.request(`${serviceOrigin}/actuator/health/readiness`)
      .its('status')
      .should('eq', 200);

    // The workflow validates the compiled frontend release-contract asset
    // before this browser run. Keep the digest in the test environment as an
    // explicit, auditable release selection rather than deriving a mutable tag.
  });

  it('logs in, creates a seller listing, reserves it as a buyer, and enforces seller authorization', () => {
    login(sellerEmail, sellerPassword);
    cy.visit('/workspace/listings');
    cy.contains('h1', 'Listing Management').should('be.visible');

    cy.contains('button', 'Add Listing').click();
    cy.get('#seller-listing-card-search').clear().type(cardQuery);
    cy.get('[role="listbox"] [role="option"]', { timeout: 15000 })
      .first()
      .click();
    cy.get('#seller-listing-card-search').invoke('val').then((value) => {
      const cardName = typeof value === 'string' ? value.trim() : '';
      if (!cardName) throw new Error('Selected catalog card did not populate the listing form.');
      cy.wrap(cardName).as('listedCardName');
    });
    cy.get('#seller-listing-price').clear().type('1');
    cy.get('#seller-listing-stock').clear().type('1');
    cy.intercept('POST', '**/seller/listings').as('createListing');
    cy.get('[role="dialog"]').contains('button', 'Add Listing').click();
    cy.wait('@createListing').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      const body = response?.body;
      const listing = body.listing ?? body.data?.listing ?? body.data ?? body;
      expect(listing.id).to.exist;
      cy.wrap(String(listing.id)).as('createdListingId');
    });
    cy.contains('Listing added', { timeout: 15000 }).should('be.visible');

    cy.get('button[aria-label="Open account menu"]').click();
    cy.get('[role="menuitem"]').contains('Logout').click();
    cy.contains('a', 'Login').should('be.visible');

    login(buyerEmail, buyerPassword);
    cy.visit('/workspace/listings');
    cy.location('pathname').should('eq', '/');

    cy.get('@listedCardName').then((listedCardName) => {
      const cardName = String(listedCardName);
      cy.visit(`/cards?search=${encodeURIComponent(cardName)}`);
      cy.contains('a', cardName, { timeout: 15000 }).first().click();
    });
    cy.contains('h2', 'Seller offers', { timeout: 15000 }).should('be.visible');
    cy.intercept('POST', '**/cart/items').as('addCartItem');
    cy.get('@createdListingId').then((listingId) => {
      cy.get(`[data-testid="quantity-select-${listingId}"]`).closest('article')
        .contains('button', 'Add to reservation cart').click();
    });
    cy.wait('@addCartItem').its('response.statusCode').should('eq', 201);
    cy.get('a[aria-label="Reservation cart"]').click();
    cy.location('pathname').should('eq', '/cart');
    cy.get('[aria-label="Loading reservation cart"]', { timeout: 15000 }).should('not.exist');
    cy.contains('h1', 'Reservation Cart', { timeout: 15000 }).should('be.visible');
    cy.get('@listedCardName').then((listedCardName) => {
      cy.contains(String(listedCardName), { timeout: 15000 }).should('be.visible');
    });
    cy.contains('a', 'Review reservation').should('be.visible').click();
    cy.contains('h1', 'Order Review').should('be.visible');
    cy.contains('button', 'Confirm reservation').click();
    cy.location('pathname').should('eq', '/checkout/confirmation');
  });
});
