describe('US-30: Feedback Popups & Error Handling UX', () => {

  const setupMockUser = () => {
    cy.clearLocalStorage();
    cy.clearCookies();
  };

  beforeEach(() => {
    setupMockUser();
  });

  it('Case 7: 404 Not Found Page renders correctly', () => {
    cy.visit('/invalid-route-12345', { failOnStatusCode: false });
    
    // Assert 404 page content
    cy.contains('404').should('be.visible');
    cy.contains('This page doesn\'t exist').should('be.visible');
    cy.contains('Back to homepage').should('be.visible');

    // Click return to home
    cy.contains('Back to homepage').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('Case 5 & 1: Contextual Login Modal and Success Popup on Collect', () => {
    cy.visit('/cards/prd-14');
    
    // Wait for the mock DB to load the card (it should render Charizard VMAX)
    cy.contains('Charizard VMAX').should('be.visible');

    // As a guest, clicking collect should show Contextual Login Modal
    cy.contains('button', 'Collect Charizard VMAX', { matchCase: false }).click();
    
    // Assert modal
    cy.contains('Log in to collect or reserve cards').should('be.visible');
    
    // Now let's login
    cy.loginByMock('BUYER');
    
    // Refresh page
    cy.visit('/cards/prd-14');
    cy.contains('Charizard VMAX').should('be.visible');
    
    // Click collect again
    cy.contains('button', 'Collect Charizard VMAX', { matchCase: false }).click();

    // Assert Success popup
    cy.contains('Added to your collection').should('be.visible');
    cy.contains('Charizard VMAX is now saved to My Collection.').should('be.visible');
    cy.contains('button', 'View collection').should('be.visible');
  });

  it('Case 8: Save Error Popup in Collection', () => {
    cy.loginByMock('BUYER');
    
    // Turn on DEV_SIMULATE_API_ERROR
    cy.window().then((win) => {
      win.localStorage.setItem('DEV_SIMULATE_API_ERROR', 'true');
    });

    cy.visit('/collection');

    // Click "Add Card" button to open the dialog
    cy.contains('button', 'Add Card', { matchCase: false }).click();

    // Type in CatalogCardPicker
    cy.get('input[placeholder="Search card name, set, rarity, or number"]').type('Charizard');
    
    // Wait for dropdown to show results and click first item (assuming it has li or button in dropdown)
    cy.contains('Charizard').first().click();

    // Click Add to Collection
    cy.contains('button', 'Add to Collection', { matchCase: false }).click();

    // It should fail and show error popup
    cy.contains('We couldn\'t add this card').should('be.visible');
    cy.contains('500 Internal Server Error').should('be.visible');
    cy.contains('button', 'Close').click({ force: true });
  });

  it('Case 2: Destructive Popup on Remove from Collection', () => {
    cy.loginByMock('BUYER');
    cy.visit('/collection');

    // Wait for mock collection to load (mock-db has items for buyer)
    // Click the delete/trash icon on the first card
    cy.get('button[title="Remove from collection"]').first().should('exist').click();

    // Assert Destructive popup
    cy.contains('Remove this card?').should('be.visible');
    cy.contains('will be removed from your personal collection').should('be.visible');
    cy.contains('button', 'Remove card').should('be.visible');
    cy.contains('button', 'Cancel').click();
  });

  it('Case 3: Warning Popup on Cart Stock Change', () => {
    cy.loginByMock('BUYER');
    
    // Turn on DEV_SIMULATE_STOCK_ERROR
    cy.window().then((win) => {
      win.localStorage.setItem('DEV_SIMULATE_STOCK_ERROR', 'true');
    });

    cy.visit('/cards/prd-14');
    cy.contains('Charizard VMAX').should('be.visible');

    // On card detail page, find the first 'Reserve now'
    cy.contains('button', 'Reserve now', { matchCase: false }).first().click();

    // Go to cart
    cy.visit('/cart');

    // Find the quantity increase button and click it
    cy.get('button[aria-label^="Increase "]').first().click();

    // Expect warning popup
    cy.contains('This card is no longer available').should('be.visible');
    cy.contains('Stock changed while you were reserving it').should('be.visible');
    cy.contains('button', 'View other offers').should('be.visible');
  });
});
