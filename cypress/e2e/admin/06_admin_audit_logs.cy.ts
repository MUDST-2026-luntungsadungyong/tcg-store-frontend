/// <reference types="cypress" />

describe('US-11: Admin Audit Logs', () => {
  beforeEach(() => {
    cy.loginByMock('ADMIN');
  });

  it('should list audit logs and show details', () => {
    cy.intercept('GET', '**/api/admin/audit-logs*', {
      statusCode: 200,
      body: {
        content: [
          {
            id: 'log-1',
            action: 'APPROVE_SELLER',
            targetType: 'SELLER',
            targetId: 'usr-2',
            actorId: 'usr-1',
            actorName: 'Admin Mock',
            actorRole: 'ADMIN',
            details: JSON.stringify({ reason: 'Looks good' }),
            ipAddress: '127.0.0.1',
            createdAt: '2023-11-01T12:00:00Z'
          }
        ],
        totalPages: 1,
        totalElements: 1
      }
    }).as('getLogs');

    cy.visit('/admin/audit-logs');
    cy.wait('@getLogs');

    // Check table row
    cy.contains('APPROVE_SELLER').should('be.visible');
    
    // Check detail viewing
    cy.get('table').contains('tr', 'APPROVE_SELLER').click();
    
    // Verify modal shows the details
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').contains('Looks good').should('be.visible');
  });
});
