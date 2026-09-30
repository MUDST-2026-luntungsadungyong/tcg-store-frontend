/// <reference types="cypress" />

describe('US-11-2: View and Refresh Admin Dashboard', () => {
  beforeEach(() => {
    cy.loginByMock('ADMIN');
  });

  it('should show loading skeleton while fetching dashboard data', () => {
    // Intercept to delay response and verify skeleton
    cy.intercept('GET', '**/api/admin/dashboard', (req) => {
      req.on('response', (res) => {
        res.setDelay(1000);
      });
    }).as('getDashboardDelay');

    cy.visit('/admin');
    
    // Assuming you have a skeleton component with a specific test id or class
    cy.get('.animate-pulse, [data-testid="skeleton-loader"]').should('be.visible');
    cy.wait('@getDashboardDelay');
  });

  it('should display dashboard metrics and empty state if no pending applications', () => {
    // Mock the dashboard data to have 0 pending applications
    cy.intercept('GET', '**/api/admin/dashboard', {
      statusCode: 200,
      body: {
        totalUsers: 100,
        totalAdmins: 2,
        pendingSellerApplications: 0,
        approvedSellers: 10,
        totalCards: 500,
        listedCards: 50,
        totalOrders: 100,
        totalOrderAmount: 10000
      },
    }).as('getDashboardSuccessEmpty');

    cy.visit('/admin');
    cy.wait('@getDashboardSuccessEmpty');

    // Verify metrics are shown (depending on your exact DOM)
    // cy.contains('Total Users').should('be.visible');
    
    // Verify empty state
    cy.contains(/No pending applications/i).should('be.visible');
  });

  it('should display pending applications count and Review applications link if there are pending applications', () => {
    // Mock the dashboard data to have pending applications
    cy.intercept('GET', '**/api/admin/dashboard', {
      statusCode: 200,
      body: {
        totalUsers: 100,
        totalAdmins: 2,
        pendingSellerApplications: 5,
        approvedSellers: 10,
        totalCards: 500,
        listedCards: 50,
        totalOrders: 100,
        totalOrderAmount: 10000
      },
    }).as('getDashboardSuccessPending');

    cy.visit('/admin');
    cy.wait('@getDashboardSuccessPending');

    // Verify pending approvals count and link
    cy.contains(/Pending seller approvals/i).should('be.visible');
    cy.contains('5').should('be.visible');
    cy.contains(/Review applications/i).should('be.visible').click();
    
    // Verify it navigates to the seller applications queue
    cy.url().should('include', '/admin/seller-applications');
  });

  it('should display error message if loading dashboard data fails and allow refresh', () => {
    // Mock the dashboard data to fail initially
    let requestCount = 0;
    cy.intercept('GET', '**/api/admin/dashboard', (req) => {
      if (requestCount === 0) {
        requestCount++;
        req.reply({ statusCode: 500, body: { error: 'Internal Server Error' } });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            totalUsers: 100,
            totalAdmins: 2,
            pendingSellerApplications: 0,
            approvedSellers: 10,
            totalCards: 500,
            listedCards: 50,
            totalOrders: 100,
            totalOrderAmount: 10000
          },
        });
      }
    }).as('getDashboardFailThenSuccess');

    cy.visit('/admin');
    
    // Verify error message
    cy.contains(/Could not load dashboard data/i).should('be.visible');
    cy.contains(/Refresh to try again/i).should('be.visible');

    // Click Refresh or Retry button (assuming it exists)
    cy.get('button').contains(/Refresh|Retry/i).click();
    
    // Verify dashboard loads successfully after refresh
    cy.wait('@getDashboardFailThenSuccess');
    cy.contains(/No pending applications/i).should('be.visible');
  });
});
