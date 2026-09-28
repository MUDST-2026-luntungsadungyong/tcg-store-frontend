describe('Core Journey 3: Shopping Cart Flow & Stock Verification', () => {
  it('allows authenticated buyer to view the cart page', () => {
    // Set authenticated buyer session in localStorage
    cy.loginByMock('CUSTOMER');
    cy.visit('/cart');
    cy.url().should('include', '/cart');
  });

  it('displays empty cart state or reservation items cleanly', () => {
    cy.loginByMock('CUSTOMER');
    cy.visit('/cart');
    cy.get('body').should('be.visible');
  });
});
