/// <reference types="cypress" />

describe('US-11-3: View Seller Application Queue', () => {
  beforeEach(() => {
    cy.loginByMock('ADMIN');
  });

  it('should show loading skeleton while fetching seller applications', () => {
    cy.intercept('GET', '**/api/admin/seller-applications', (req) => {
      req.on('response', (res) => {
        res.setDelay(1000);
      });
    }).as('getApplicationsDelay');

    cy.visit('/admin/seller-applications');
    
    // Verify skeleton
    cy.get('.animate-pulse, [data-testid="skeleton-loader"]').should('be.visible');
    cy.wait('@getApplicationsDelay');
  });

  it('should display error message and retry button if API fails', () => {
    let requestCount = 0;
    cy.intercept('GET', '**/api/admin/seller-applications', (req) => {
      if (requestCount === 0) {
        requestCount++;
        req.reply({ statusCode: 500, body: { error: 'Internal Server Error' } });
      } else {
        req.reply({ statusCode: 200, body: [] }); // Success on retry
      }
    }).as('getApplicationsFailThenSuccess');

    cy.visit('/admin/seller-applications');
    
    // Verify error message
    cy.contains(/Unable to load seller applications/i).should('be.visible');
    cy.contains(/Please try again/i).should('be.visible');

    // Click Retry
    cy.get('button').contains(/Retry/i).click();
    
    // Should succeed on second try and show empty state (since body is [])
    cy.wait('@getApplicationsFailThenSuccess');
  });

  it('should display empty state if there are no pending applications', () => {
    cy.intercept('GET', '**/api/admin/seller-applications', {
      statusCode: 200,
      body: [],
    }).as('getApplicationsEmpty');

    cy.visit('/admin/seller-applications');
    cy.wait('@getApplicationsEmpty');

    cy.get('table').should('not.exist');
    cy.contains(/The review queue is clear/i).should('exist');
  });

  it('should display a table of pending applications with required columns', () => {
    const mockApplications = [
      {
        id: '1',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        shopName: "John's Cards",
        shopDescription: 'Selling rare cards',
        requestedAt: '2023-10-27T10:00:00Z',
        sellerStatus: 'PENDING'
      }
    ];

    cy.intercept('GET', '**/api/admin/seller-applications', {
      statusCode: 200,
      body: mockApplications,
    }).as('getApplicationsSuccess');

    cy.visit('/admin/seller-applications');
    cy.wait('@getApplicationsSuccess');

    // Verify table exists (but might be hidden on mobile, so we don't strictly require be.visible if we run headlessly)
    cy.get('table').should('exist');

    // Verify columns (these can be the headers or the data)
    cy.contains('John Doe').should('be.visible');
    cy.contains('john@example.com').should('be.visible');
    cy.contains("John's Cards").should('be.visible');
    
    // Verify Approve and Reject buttons exist
    cy.get('button').contains(/Approve/i).should('be.visible');
    cy.get('button').contains(/Reject/i).should('be.visible');
  });
});
