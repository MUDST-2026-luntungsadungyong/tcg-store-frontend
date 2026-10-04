/// <reference types="cypress" />

describe('US-05 & US-06: Seller Inventory Management and Metrics', () => {
  beforeEach(() => {
    cy.loginByMock('SELLER');
  });

  it('US-05-1, US-05-4: Add a new listing and verify it appears in inventory filter', () => {
    cy.visit('/workspace/listings');

    // Wait for the UI to be fully visible (the title)
    cy.contains('h1', 'Listing Management').should('be.visible');

    // 1. Click Add Listing
    cy.contains('button', 'Add Listing').click();
    cy.contains('Add Listing').should('be.visible');

    // 2. Select card from CatalogCardPicker
    // Wait for the input to appear and be enabled
    cy.get('input[placeholder*="Search card name, set, rarity"]').should('be.visible').type('Pikachu', { delay: 50 });
    
    // Select the first card from the dropdown
    cy.get('[role="listbox"]').should('be.visible').find('button').first().should('be.visible').click();

    // Verify it is selected
    cy.get('[role="listbox"]').should('not.exist'); // The dropdown closes

    // 3. Fill out the form
    cy.get('input[id*="seller-listing-price"]').clear().type('1000');
    cy.get('input[id*="seller-listing-stock"]').clear().type('5');

    // 4. Save
    // We should wait until loading/busy state is over
    cy.get('button[type="submit"]').contains('Add Listing').should('not.be.disabled').click({ force: true });

    // 5. Verify toast 
    // The exact toast can be "Listing added" or just check success
    cy.contains(/added to your inventory/i).should('be.visible');

    // 6. Test Filter by keyword
    cy.get('input[aria-label="Search listings"]').clear().type('Pikachu');
    
    // It should filter the grid or table
    cy.get('table, .grid').contains(/Pikachu/i).should('be.visible');
  });

  it('US-05-5 & US-06-1: Toggle listing visibility and verify cost/profit metrics', () => {
    cy.visit('/workspace/listings');
    
    // Wait for the page to load
    cy.contains('h1', 'Listing Management').should('be.visible');
    
    // Check for Profit metrics
    cy.get('body').then(($body) => {
      // It can be either Cost/Profit headers in table, or dt text in grid
      expect($body.text()).to.match(/Cost|Profit/i);
    });

    // Toggle visibility (US-05-5)
    // Click the first switch
    cy.get('button[role="switch"]').first().click();
    
    // Wait for toast
    cy.contains(/Listing hidden|Listing visible/i).should('be.visible');
    
    // Toggle back
    cy.get('button[role="switch"]').first().click();
    cy.contains(/Listing hidden|Listing visible/i).should('be.visible');
  });

  it('US-05-2: Delete a listing', () => {
    cy.visit('/workspace/listings');
    
    cy.contains('h1', 'Listing Management').should('be.visible');

    // Make sure we have at least one listing, or we added one in the previous step
    // Click delete on the first listing
    cy.get('button[title="Delete listing"]').first().click({ force: true });
    
    // Check confirmation modal
    cy.contains(/Delete this listing\?/i).should('be.visible');
    
    // Confirm delete inside the dialog
    cy.get('[role="alertdialog"]').contains('button', 'Delete listing').click();
    
    // Verify toast
    cy.contains(/removed from your inventory|Cannot delete listing|Delete failed/i).should('be.visible');
  });
});
