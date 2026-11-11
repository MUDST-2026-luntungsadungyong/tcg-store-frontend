/// <reference types="cypress" />
describe('Auction administration', () => {
  beforeEach(() => { cy.visit('/'); cy.loginByMock('ADMIN'); });
  for (const viewport of [{ width: 1280, height: 800, name: 'desktop' }, { width: 390, height: 844, name: 'mobile' }]) {
    it(`renders monitoring, disputes and default cases at ${viewport.name} size`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.intercept('GET', '**/api/admin/auction-default-cases*', { body: { content: [], totalPages: 0, number: 0, totalElements: 0, size: 20 } }).as('cases');
      cy.visit('/admin/auction-default-cases'); cy.wait('@cases'); cy.contains('No default cases yet').should('be.visible'); cy.screenshot(`default-cases-${viewport.name}`);
      cy.intercept('GET', '**/api/admin/auctions/live-feed*', { body: { content: [{ id: 12, sellerId: 7, cardName: 'Charizard', status: 'ACTIVE', endAt: '2026-11-12T10:00:00Z', bidCount: 4, highestBid: 1200, leadingBidderId: 3, pausedAt: null, latestBidAt: '2026-11-11T10:00:00Z', highRiskUser: true, priceAnomaly: true }], totalPages: 1 } }).as('monitor');
      cy.visit('/admin/auctions'); cy.wait('@monitor'); cy.contains('Unusual price increase').should('exist'); cy.contains('High-risk bidder').should('exist'); cy.contains('Search filters the auctions on the current page.').should('exist'); cy.screenshot(`monitor-populated-${viewport.name}`);
      cy.intercept('GET', '**/api/admin/auction-disputes*', { body: { content: [{ id: 8, auctionId: 12, orderId: 42, buyerId: 3, sellerId: 7, reason: 'Card arrived damaged', status: 'PENDING', createdAt: '2026-11-11T10:00:00Z', decidedAt: null, decisionReason: null, evidenceUrls: ['/api/admin/auction-disputes/8/evidence/4'] }], totalPages: 1 } }).as('disputes');
      cy.intercept('GET', '**/api/admin/auction-disputes/8/evidence/4', req => { expect(req.headers.authorization).to.equal('Bearer mock-jwt-token-admin'); req.reply({ statusCode: 200, headers: { 'content-type': 'image/png' }, body: 'test' }); }).as('evidence');
      cy.visit('/admin/auction-disputes'); cy.wait('@disputes'); cy.contains('Card arrived damaged').should('be.visible'); cy.screenshot(`disputes-populated-${viewport.name}`); cy.contains('Download evidence 1').click(); cy.wait('@evidence');
      cy.intercept('GET', '**/api/admin/auction-disputes*', { body: { content: [], totalPages: 0 } }).as('emptyDisputes'); cy.visit('/admin/auction-disputes'); cy.wait('@emptyDisputes'); cy.contains('No disputes yet').should('be.visible'); cy.screenshot(`disputes-empty-${viewport.name}`);
      cy.intercept('GET', '**/api/admin/auctions/live-feed*', { body: { content: [], totalPages: 0 } }).as('emptyMonitor'); cy.visit('/admin/auctions'); cy.wait('@emptyMonitor'); cy.contains('No auctions to monitor').should('be.visible'); cy.screenshot(`monitor-empty-${viewport.name}`);
    });
  }
});
