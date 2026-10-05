/// <reference types="cypress" />

describe('US-10: Collection and Leaderboard', () => {
  beforeEach(() => {
    // Both parts can be tested with BUYER
    cy.loginByMock('BUYER');
  });

  it('US-10-1, US-10-2, US-10-3: View, Add and Remove from Personal Collection', () => {
    cy.visit('/collection');

    // US-10-1: View Personal Collection Album
    cy.contains('h1', 'My Collection').should('be.visible');

    // Ensure we can see the "Add Card" button
    cy.contains('button', 'Add Card').should('be.visible');

    // US-10-2: Add Card to Collection from Catalog
    cy.contains('button', 'Add Card').click();
    
    // Wait for the modal/input
    cy.get('input[placeholder*="Search card name"]').should('be.visible').type('Pikachu', { delay: 50 });
    
    // Click the first card from the listbox
    cy.get('[role="listbox"]').should('be.visible').find('button').first().should('be.visible').click();

    // Verify listbox is gone
    cy.get('[role="listbox"]').should('not.exist');

    // Save
    cy.contains('button', 'Add to Collection').should('not.be.disabled').click({ force: true });
    
    // Check toast
    cy.contains(/added to your collection/i).should('be.visible');
    
    // The card should appear in the collection view (search for Pikachu in the grid)
    cy.get('#seller-inventory-panel, .grid').contains(/Pikachu/i).should('be.visible');

    // US-10-3: Remove Card from Collection
    // Click the delete button on the first card
    cy.get('button[title="Remove from collection"]').first().click({ force: true });
    
    // FeedbackPopup Confirmation
    cy.contains(/Remove this card\?/i).should('be.visible');
    
    // Confirm delete
    cy.get('[role="alertdialog"]').contains('button', 'Remove card').click();
    
    // Check toast
    cy.contains(/Removed .* from your collection/i).should('be.visible');
  });

  it('US-10-6: Public Collector Showcase & Top Collector Leaderboard', () => {
    // Go to Home Page to view Leaderboard
    cy.visit('/');
    
    // Verify Leaderboard Section
    cy.contains('h2', 'The Best Collections').should('be.visible');
    
    // The leaderboard shows top 10 collectors, so it should have some rows or cards
    cy.contains(/cards/i).should('be.visible'); // at least one collector should have some cards mentioned
    
    // Click on the first collector's link (usually an anchor wrapping the collector's name or avatar)
    // The link should point to /collections/:userId
    cy.get('a[href^="/collections/"]').first().click();

    // Verify navigation to Public Collection Page
    cy.url().should('include', '/collections/');
    
    // Verify Public Collection Album
    cy.contains(/Collection/i).should('be.visible'); // Should have the word Collection (e.g. "John's Collection")
  });
});
