const api = 'http://localhost:8080/api';

const notification = (type: 'SELLER_STOCK_CRITICAL' | 'SELLER_OUT_OF_STOCK') => ({
  id: type,
  type,
  title: 'Charizard',
  message: 'Stock needs attention.',
  cardName: 'Charizard',
  actionPath: null,
  createdAt: '2026-11-13T09:00:00Z',
  readAt: null,
});

describe('Seller stock notification actions', () => {
  beforeEach(() => {
    cy.intercept('GET', `${api}/notifications*`, (req) => {
      const type = new URL(req.url).searchParams.get('type');
      req.reply({
        statusCode: 200,
        body: { content: [notification(type === 'SELLER_OUT_OF_STOCK' ? 'SELLER_OUT_OF_STOCK' : 'SELLER_STOCK_CRITICAL')], totalElements: 1, totalPages: 1, number: 0, size: 20, first: true, last: true },
      });
    });
    cy.intercept('PATCH', `${api}/notifications/*/read`, (req) => {
      const id = req.url.split('/').at(-2);
      const type = id === 'SELLER_OUT_OF_STOCK' ? 'SELLER_OUT_OF_STOCK' : 'SELLER_STOCK_CRITICAL';
      req.reply({ statusCode: 200, body: { ...notification(type), readAt: '2026-11-13T09:01:00Z' } });
    });
    cy.intercept('GET', `${api}/seller/listings/stock-forecast*`, {
      statusCode: 200,
      body: { generatedAt: '2026-11-13T09:00:00Z', windowDays: 30, summary: { totalSkus: 0, outOfStockCount: 0, criticalCount: 0, lowCount: 0, safeCount: 0, noRecentSalesCount: 0 }, items: [] },
    });
    cy.intercept('GET', `${api}/seller/listings*`, { statusCode: 200, body: [] });
    cy.loginByMock('SELLER');
  });

  it('opens the guarded stock forecast from a critical stock notification', () => {
    cy.visit('/notifications');
    cy.contains('button', 'View stock forecast').click();

    cy.location('pathname').should('eq', '/workspace/stock-forecast');
    cy.location('search').should('eq', '?search=Charizard');
    cy.get('h1').should('contain.text', 'Stockout Forecast');
    cy.get('input[aria-label="Search stock forecast"]').should('have.value', 'Charizard');
    cy.contains('Automatic stock alerts.').should('be.visible');
    cy.get('[aria-label="Stock urgency summary"]').should('be.visible');
  });

  it('opens the guarded listing manager from an out-of-stock notification', () => {
    cy.intercept('GET', `${api}/notifications*`, {
      statusCode: 200,
      body: { content: [notification('SELLER_OUT_OF_STOCK')], totalElements: 1, totalPages: 1, number: 0, size: 20, first: true, last: true },
    });
    cy.visit('/notifications');
    cy.contains('button', 'Manage listing').click();

    cy.location('pathname').should('eq', '/workspace/listings');
    cy.location('search').should('eq', '?search=Charizard');
    cy.get('h1').should('contain.text', 'Listing Management');
    cy.get('input[aria-label="Search listings"]').should('have.value', 'Charizard');
  });
});
