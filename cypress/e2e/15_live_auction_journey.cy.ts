import { openAuctionWizard, reviewImmediateAuction } from '../support/auctionJourney';

const live = String(Cypress.expose('AUCTION_LIVE_E2E')).toLowerCase() === 'true';
const auctions = '**/api/seller/auctions';

(live ? describe : describe.skip)('US-13 live browser auction journey', () => {
  it('creates and cancels a real auction, checking stock before, during and after', () => {
    const cardName = String(Cypress.expose('E2E_AUCTION_CARD_NAME') || '');
    expect(cardName, 'CYPRESS_E2E_AUCTION_CARD_NAME must identify dedicated one-unit seller stock').not.to.equal('');
    cy.env(['E2E_SELLER_EMAIL', 'E2E_SELLER_PASSWORD'], { log: false }).then((credentials) => {
      expect(Boolean(credentials.E2E_SELLER_EMAIL && credentials.E2E_SELLER_PASSWORD), 'test seller credentials configured').to.eq(true);
      cy.visit('/login');
      cy.get('#email').type(credentials.E2E_SELLER_EMAIL, { log: false });
      cy.get('#password').type(credentials.E2E_SELLER_PASSWORD, { log: false });
      cy.get('form').contains('button', /^Login$/).click();
      cy.location('pathname').should('not.eq', '/login');
    });
    cy.intercept('GET', `${auctions}/inventory`).as('inventory');
    // Keep the multipart upload out of Cypress interception. The subsequent
    // publish and rendered stored images prove that the draft upload succeeded.
    cy.intercept('POST', `${auctions}/*/publish`).as('publish');
    cy.intercept('POST', `${auctions}/*/cancel`).as('cancel');
    let productId: number;
    openAuctionWizard(cardName);
    cy.wait('@inventory').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const matches = response?.body.filter((item: { cardName: string }) => item.cardName === cardName);
      expect(matches, 'one matching listing for the test seller').to.have.length(1);
      expect(matches[0].availableQuantity).to.eq(1);
      productId = matches[0].productId;
    });
    reviewImmediateAuction();
    cy.contains('button', /^Confirm & Create Auction$/).click();
    cy.wait('@publish').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body).to.include({ status: 'ACTIVE', bidCount: 0, productId });
      const id = response?.body.id;
      cy.location('pathname').should('eq', `/workspace/auctions/${id}`);
      cy.get('img[alt="Front photo"]').should($image => {
        expect(($image[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
      });
      cy.get('img[alt="Back photo"]').should($image => {
        expect(($image[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
      });
      cy.visit('/workspace/auctions/new');
      cy.contains('button', /^My Collection$/).click();
      cy.contains('button', cardName).should('be.disabled').and('contain.text', 'Unavailable');
      cy.visit(`/workspace/auctions/${id}`);
    });

    cy.contains('button', /^Cancel Auction$/i).click();
    cy.get('[role="alertdialog"]').contains('button', /^Cancel Auction$/).click();
    cy.wait('@cancel').its('response.body.status').should('eq', 'CANCELLED');
    cy.visit('/workspace/auctions/new');
    cy.contains('button', /^My Collection$/).click();
    cy.contains('button', cardName).should('be.enabled').and('contain.text', '1 available');
  });
});
