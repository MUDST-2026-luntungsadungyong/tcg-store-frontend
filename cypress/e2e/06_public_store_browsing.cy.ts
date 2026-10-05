describe('US-06 & US-07: Public Store Browsing', () => {
  const setupMockUser = () => {
    // Unauthenticated access
    cy.clearLocalStorage();
    cy.clearCookies();
  };

  beforeEach(() => {
    setupMockUser();
  });

  it('Scenario 1: Store Not Found (404) gracefully handles error with new ErrorState', () => {
    // Mock 404 for store
    cy.intercept('GET', '**/api/stores/invalid-id', {
      statusCode: 404,
      body: { message: 'Not found' }
    }).as('getInvalidStore');

    cy.visit('/stores/invalid-id');
    cy.wait('@getInvalidStore');

    // Assert the new ErrorState component is rendered
    // Should have "Store not found or unavailable." message and a "Retry" button
    cy.contains('Store not found or unavailable.').should('be.visible');
    cy.contains('button', 'Retry').should('be.visible');
  });

  it('Scenario 2: Store with No Inventory shows empty state gracefully', () => {
    // Mock successful store but 0 products by using an unknown ID like usr-999
    // The mock DB has no products for usr-999, so availableListings will naturally return []
    cy.intercept('GET', '**/api/stores/usr-999', {
      statusCode: 200,
      body: {
        sellerId: 'usr-999',
        shopName: 'Empty Shop',
        shopDescription: 'Just opened, waiting for stock!',
        phone: '0812345678'
      }
    }).as('getStore');

    cy.visit('/stores/usr-999');
    cy.wait('@getStore');

    // Assert Shop Info
    cy.contains('Empty Shop').should('be.visible');
    cy.contains('Just opened, waiting for stock!').should('be.visible');
    cy.contains('0812345678').should('be.visible');

    // Assert 0 cards and empty state message
    cy.contains('0 cards').should('be.visible');
    cy.contains('This seller has no public listings right now.').should('be.visible');
  });

  it('Scenario 3: Store with Available Listings allows browsing to product details', () => {
    // usr-3 (Brock Pewter) has products in the mock DB
    cy.intercept('GET', '**/api/stores/usr-3', {
      statusCode: 200,
      body: {
        sellerId: 'usr-3',
        shopName: 'Legendary Cards Shop',
        shopDescription: 'Best cards in town.',
      }
    }).as('getStore');

    cy.visit('/stores/usr-3');
    cy.wait('@getStore');

    // Assert Shop Info
    cy.contains('Legendary Cards Shop').should('be.visible');
    
    // Assert cards exist (Mock DB has many cards for usr-3)
    cy.contains('cards').should('be.visible');
    
    // Click on the first card listing
    cy.get('a[href^="/cards/"]').first().click();

    // Verify navigation
    cy.url().should('include', '/cards/');
  });
});
