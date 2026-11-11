describe('Auction default case review', () => {
  it('shows a seller the pending report without decision controls on mobile', () => {
    cy.viewport(375, 812);
    cy.visit('/login');
    cy.loginByMock('SELLER');
    cy.intercept('GET', '**/api/auction-default-cases/me*', { content: [{
      id: 43, auctionId: 18, orderId: 20, buyerId: 3, sellerId: 2,
      reportReason: 'No contact', status: 'PENDING', createdAt: '2026-11-01T00:00:00Z', history: [],
    }], totalPages: 1 }).as('mine');
    cy.visit('/workspace/auctions/default-cases');
    cy.wait('@mine');
    cy.get('[data-testid="default-case-43"]').contains('PENDING').should('be.visible');
    cy.contains('button', 'Approve').should('not.exist');
    cy.contains('button', 'Reject').should('not.exist');
    cy.contains('reviewed by an administrator').should('be.visible');
  });

  it('preserves the reason on failure and retries a rejection', () => {
    let attempts = 0;
    cy.visit('/login');
    cy.loginByMock('ADMIN');
    cy.intercept('GET', '**/api/admin/auction-default-cases*', { content: [{
      id: 44, auctionId: 18, orderId: 20, buyerId: 3, sellerId: 2,
      reportReason: 'No contact', status: 'PENDING', createdAt: '2026-11-01T00:00:00Z', history: [],
    }], totalPages: 1 }).as('cases');
    cy.intercept('POST', '**/api/admin/auction-default-cases/44/reject', req => {
      expect(req.body.reason).to.eq('Insufficient evidence');
      attempts += 1;
      req.reply(attempts === 1 ? { statusCode: 500, body: { message: 'Try again' } } : { statusCode: 200, body: {} });
    }).as('reject');
    cy.visit('/admin/auction-default-cases');
    cy.wait('@cases');
    cy.contains('button', 'Reject').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.contains('label', 'Decision reason').find('textarea').type('Insufficient evidence');
      cy.contains('button', 'Confirm decision').click();
      cy.wait('@reject');
      cy.get('[role="alert"]').should('be.visible');
      cy.get('textarea').should('have.value', 'Insufficient evidence');
      cy.contains('button', 'Confirm decision').click();
    });
    cy.wait('@reject');
    cy.contains('[role="dialog"]', 'Confirm decision').should('not.exist');
  });

  it('lets an administrator approve and reverse with recorded reasons', () => {
    let record = {
      id: 42, auctionId: 17, orderId: 19, buyerId: 3, sellerId: 2,
      reportReason: 'Buyer did not respond', status: 'PENDING', createdAt: '2026-11-01T00:00:00Z',
      decidedAt: null as string | null, decisionReason: null as string | null,
      history: [] as Array<{ action: string; reason: string; adminId: number; createdAt: string }>,
    };
    const url = '**/api/admin/auction-default-cases';
    cy.visit('/login');
    cy.loginByMock('ADMIN');
    cy.intercept('GET', `${url}*`, req => req.reply({ content: [record], totalPages: 1 })).as('cases');
    cy.intercept('POST', `${url}/42/*`, req => {
      const action = req.url.endsWith('/approve') ? 'APPROVED' : 'REVERSED';
      expect(req.body.reason).to.be.oneOf(['Reviewed evidence', 'New evidence']);
      record = { ...record, status: action, decidedAt: new Date().toISOString(), decisionReason: req.body.reason,
        history: [...record.history, { action, reason: req.body.reason, adminId: 1, createdAt: new Date().toISOString() }] };
      req.reply(record);
    }).as('decision');
    cy.visit('/admin/auction-default-cases');
    cy.wait('@cases');
    cy.get('[data-testid="default-case-42"]').contains('PENDING');
    cy.contains('button', 'Approve').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.contains('button', 'Confirm decision').should('be.disabled');
      cy.contains('label', 'Decision reason').find('textarea').type('Reviewed evidence');
      cy.contains('button', 'Confirm decision').click();
    });
    cy.wait('@decision').its('request.body.reason').should('eq', 'Reviewed evidence');
    cy.get('[data-testid="default-case-42"]').contains('APPROVED');
    cy.contains('button', 'Reverse').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.contains('label', 'Decision reason').find('textarea').type('New evidence');
      cy.contains('button', 'Confirm decision').click();
    });
    cy.wait('@decision').its('request.body.reason').should('eq', 'New evidence');
    cy.get('[data-testid="default-case-42"]').contains('REVERSED');
    cy.contains('Review history').click();
    cy.contains('Reviewed evidence').should('be.visible');
    cy.contains('New evidence').should('be.visible');
  });
});
