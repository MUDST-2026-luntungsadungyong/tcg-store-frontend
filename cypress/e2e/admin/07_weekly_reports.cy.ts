/// <reference types="cypress" />

const report = {
  weekEndDate: '2026-11-08', periodStart: '2026-11-01T23:59:00', periodEnd: '2026-11-08T23:59:00', generatedAt: '2026-11-09T00:00:00',
  stockAdded: 20, stockRemoved: 2, unitsSold: 2, inventoryUnits: 18, totalInventoryValue: 1800, inventoryCost: 1000,
  revenue: 200, grossProfit: 80, totalFeesCollected: 10,
  topByRevenue: [{ cardId: 'test-card', name: 'Pikachu', unitsSold: 2, revenue: 200, grossProfit: 80 }],
  topByProfit: [{ cardId: 'test-card', name: 'Pikachu', unitsSold: 2, revenue: 200, grossProfit: 80 }],
  stagnantListings: 0, stagnantUnits: 0, stagnantValue: 0, stagnantInventory: [],
};
const history = { content: [{ weekEndDate: report.weekEndDate, generatedAt: report.generatedAt, totalInventoryValue: 1800, totalFeesCollected: 10 }], number: 0, size: 20, totalElements: 1, totalPages: 1, trackingSince: '2026-11-01T23:59:00' };

describe('US-27-1 weekly admin reports', () => {
  beforeEach(() => {
    // External font services are not part of the report contract or smoke test.
    cy.intercept('GET', 'https://fonts.googleapis.com/**', { headers: { 'content-type': 'text/css' }, body: '' });
    cy.visit('/login');
    cy.loginByMock('ADMIN');
    cy.intercept('GET', '**/api/admin/reports/weekly-summary/history*', { body: history, delay: 250 }).as('history');
    cy.intercept('GET', '**/api/admin/reports/weekly-summary?*', { body: report }).as('report');
  });

  it('loads a saved report and exports it through the authenticated API', () => {
    cy.intercept('GET', '**/api/admin/reports/weekly-summary/export*', req => {
      expect(req.headers.authorization).to.equal('Bearer mock-jwt-token-admin');
      expect(req.query.weekEnd).to.equal('2026-11-08');
      req.reply({ headers: { 'content-type': 'text/csv;charset=UTF-8' }, body: 'section,metric\r\nstock,added\r\n' });
    }).as('export');
    cy.visit('/admin/reports/weekly');
    cy.contains('Loading report history').should('be.visible');
    cy.wait('@history'); cy.wait('@report');
    cy.contains('Inventory retail value').should('be.visible');
    cy.contains('Recorded platform fees').should('be.visible');
    cy.contains('Top 10 cards by revenue').should('exist');
    cy.contains('Top 10 cards by gross profit').should('exist');
    cy.contains('No stagnant inventory in this period.').should('exist');
    cy.contains('button', 'Export CSV').click(); cy.wait('@export');
    cy.readFile('cypress/downloads/weekly-report-2026-11-08.csv').should('contain', 'stock,added');
  });

  it('shows the full-week requirement when no reports exist', () => {
    cy.intercept('GET', '**/api/admin/reports/weekly-summary/history*', { body: { ...history, content: [], totalElements: 0, totalPages: 0 } });
    cy.visit('/admin/reports/weekly');
    cy.contains('No completed weekly reports yet').should('be.visible');
    cy.contains('button', 'Export CSV').should('be.disabled');
  });

  it('shows an API failure and successfully retries', () => {
    let requests = 0;
    cy.intercept('GET', '**/api/admin/reports/weekly-summary/history*', req => {
      requests++;
      req.reply(requests === 1 ? { statusCode: 500, body: {} } : { body: history });
    });
    cy.visit('/admin/reports/weekly');
    cy.get('[role="alert"]').should('contain', 'Could not load weekly reports');
    cy.contains('button', 'Try again').click();
    cy.contains('Inventory retail value').should('be.visible');
  });

  it('keeps non-admin users out of the report route', () => {
    cy.loginByMock('CUSTOMER');
    cy.visit('/admin/reports/weekly');
    cy.location('pathname').should('eq', '/');
    cy.contains('Weekly stock & profit reports').should('not.exist');
  });
});
