import type { Auction, AuctionInventory, CancellationRequest } from '../../../src/features/auctions/api/auctions';
import { auctionField, openAuctionWizard, reviewImmediateAuction, selectAuctionPhoto } from '../../support/auctionJourney';

const seller = '**/api/seller/auctions';
const admin = '**/api/admin/auction-cancellation-requests';
const inventory: AuctionInventory = {
  productId: 41, cardId: 'auction-card', cardName: 'Empoleon', setName: 'Diamond & Pearl',
  imageUrl: null, cardNumber: '4', rarity: 'Rare', condition: 'NM', status: 'SHOW', availableQuantity: 1, collectionMatch: true,
};

function auction(status: Auction['status']): Auction {
  return {
    id: 17, status, productId: 41, cardId: 'auction-card', cardName: 'Empoleon', setName: 'Diamond & Pearl',
    imageUrl: null, condition: 'NM', gradingCompany: null, grade: null, certNumber: null,
    frontImageUrl: null, backImageUrl: null, startPrice: 100, reservePrice: null, buyItNowPrice: null,
    startMode: 'NOW', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 86_400_000).toISOString(),
    durationHours: 24, bidCount: 0, highestBid: null, updatedAt: new Date().toISOString(), cancellationRequest: null,
  };
}

describe('US-13 auction management with HTTP fixtures', () => {
  it('publishes an auction after review and cancels it when there are no bids', () => {
    let record: Auction | undefined;
    cy.visit('/login');
    cy.loginByMock('SELLER');
    cy.intercept('GET', seller, (request) => request.reply(record ? [record] : []));
    cy.intercept('GET', `${seller}/inventory`, [inventory]);
    cy.intercept('GET', `${seller}/17`, (request) => request.reply(record));
    cy.intercept('POST', `${seller}/drafts`, (request) => {
      expect(request.headers['idempotency-key']).to.be.a('string').and.have.length.greaterThan(0);
      expect(request.headers['content-type']).to.contain('multipart/form-data');
      const body = typeof request.body === 'string' ? request.body : Cypress.Buffer.from(request.body).toString('utf8');
      expect(body).to.include('name="frontImage"').and.to.include('filename="front.png"');
      expect(body).to.include('name="backImage"').and.to.include('filename="back.png"');
      record = auction('DRAFT');
      request.reply({ statusCode: 201, body: record });
    }).as('createDraft');
    cy.intercept('POST', `${seller}/17/publish`, (request) => {
      record = auction('ACTIVE');
      request.reply(record);
    }).as('publish');
    cy.intercept('POST', `${seller}/17/cancel`, (request) => {
      record = auction('CANCELLED');
      request.reply(record);
    }).as('cancel');

    openAuctionWizard('Empoleon');
    reviewImmediateAuction();
    cy.contains('button', /^Confirm & Create Auction$/).click();
    cy.wait('@createDraft').its('response.statusCode').should('eq', 201);
    cy.wait('@publish').its('response.body.status').should('eq', 'ACTIVE');
    cy.location('pathname').should('eq', '/workspace/auctions/17');

    cy.contains('button', /^Cancel Auction$/i).click();
    cy.get('[role="alertdialog"]').contains('button', /^Cancel Auction$/).click();
    cy.wait('@cancel').its('response.body.status').should('eq', 'CANCELLED');
    cy.contains(/auction has been cancelled/i).should('be.visible');
  });

  it('saves an incomplete draft and publishes it after scheduling from the edit page', () => {
    const start = '2026-12-02T11:00:00.000Z';
    let record = {
      ...auction('DRAFT'), startPrice: null, startAt: null, endAt: null, durationHours: null,
    } as Auction;
    cy.clock(new Date('2026-12-01T10:00:00Z').getTime(), ['Date']);
    cy.visit('/login');
    cy.loginByMock('SELLER');
    cy.intercept('GET', seller, []);
    cy.intercept('GET', `${seller}/inventory`, [inventory]);
    cy.intercept('POST', `${seller}/drafts`, { statusCode: 201, body: record }).as('saveDraft');
    cy.intercept('GET', `${seller}/17`, request => request.reply(record));
    cy.intercept('PUT', `${seller}/17/draft`, request => {
      const body = typeof request.body === 'string' ? request.body : Cypress.Buffer.from(request.body).toString('utf8');
      expect(body).to.include('name="startAt"').and.to.include(start);
      record = { ...record, startPrice: 150, startMode: 'SCHEDULED', startAt: start, durationHours: 72 };
      request.reply(record);
    }).as('updateDraft');
    cy.intercept('POST', `${seller}/17/publish`, request => {
      record = { ...record, status: 'SCHEDULED', endAt: '2026-12-05T11:00:00.000Z' };
      request.reply(record);
    }).as('schedule');

    cy.visit('/workspace/auctions/new');
    cy.contains('button', /^Save Draft$/).click();
    cy.wait('@saveDraft').its('response.body.status').should('eq', 'DRAFT');
    cy.contains('Draft saved').should('be.visible');
    cy.visit('/workspace/auctions/17/edit');
    auctionField(/Start price/).clear().type('150');
    selectAuctionPhoto('Front photo', 'front.png');
    selectAuctionPhoto('Back photo', 'back.png');
    cy.contains('button', /^Next: Pricing$/).click();
    cy.contains('button', /^Next: Scheduling$/).click();
    cy.contains('button', /^Schedule for Later$/i).click();
    auctionField(/^Start date$/).type('2026-12-02');
    auctionField(/^Start time$/).type('18:00:00');
    cy.contains('button', /^3 days$/i).click();
    cy.contains('button', /^Review Auction$/).click();
    cy.contains('button', /^Confirm & Create Auction$/).click();
    cy.wait('@updateDraft').its('response.body.status').should('eq', 'DRAFT');
    cy.wait('@schedule').its('response.body.status').should('eq', 'SCHEDULED');
    cy.contains('Auction scheduled successfully').should('be.visible');
  });

  it('allows Admin to review and reject a request with a reason', () => {
    const pending: CancellationRequest = {
      id: 29, auctionId: 17, auctionStatus: 'ACTIVE', cardName: 'Empoleon', sellerId: 2,
      productId: 41, imageUrl: null, condition: 'NM', highestBid: 125,
      endAt: new Date(Date.now() + 86_400_000).toISOString(),
      sellerName: 'Test Seller', bidCount: 1, reason: 'Water damage', status: 'PENDING_REVIEW',
      decisionReason: null, createdAt: new Date().toISOString(), reviewedAt: null, evidence: [],
    };
    let record = pending;
    cy.visit('/login');
    cy.loginByMock('ADMIN');
    cy.intercept('GET', admin, (request) => request.reply([record]));
    cy.intercept('GET', `${admin}/29`, (request) => request.reply(record)).as('review');
    cy.intercept('POST', `${admin}/29/reject`, (request) => {
      expect(request.body.reason).to.eq('More evidence is needed');
      record = { ...pending, status: 'REJECTED', decisionReason: request.body.reason, reviewedAt: new Date().toISOString() };
      request.reply(record);
    }).as('reject');
    cy.visit('/admin/auction-cancellation-requests');
    cy.contains('Empoleon').should('be.visible');
    cy.contains('a', /^Review request$/).click();
    cy.wait('@review').its('response.statusCode').should('eq', 200);
    cy.contains('Water damage').should('be.visible');
    cy.contains('button', /^Reject Request$/).click();
    cy.get('#cancellation-reject-reason').type('More evidence is needed');
    cy.get('button[form="cancellation-decision"]').contains(/^Confirm Rejection$/).click();
    cy.wait('@reject').its('response.body.auctionStatus').should('eq', 'ACTIVE');
    cy.contains(/more evidence is needed/i).should('be.visible');
  });
});
