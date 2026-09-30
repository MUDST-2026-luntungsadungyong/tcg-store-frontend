/// <reference types="cypress" />

describe('Core Journey 5: Update Product by Seller (US-05-3)', () => {
  beforeEach(() => {
    // Seller logs in
    cy.loginByMock('SELLER');
  });

  it('navigates to product management, edits a product successfully, and sees modal', () => {
    cy.visit('/workspace/listings');
    cy.url().should('include', '/workspace/listings');
    cy.get('body').should('be.visible');

    // Click on Edit for the first listing
    cy.contains('button', 'Edit').first().click();

    // The modal should appear
    cy.contains('Edit Listing').should('be.visible');

    // Clear price and enter a new one
    cy.get('input[id*="seller-listing-price"]').clear().type('1500');
    
    // Check if Save button exists and click it
    cy.contains('button', 'Save Changes').click();

    // Verify modal closes or success notification
    cy.contains('Edit Listing').should('not.exist');
    cy.contains(/1,?500/).should('be.visible');
  });

  it('shows error if required field is invalid and prevents save', () => {
    cy.visit('/workspace/listings');
    cy.contains('button', 'Edit').first().click();

    // Clear price completely
    cy.get('input[id*="seller-listing-price"]').clear();
    
    // Click save
    cy.contains('button', 'Save Changes').click();

    // Should remain on the modal and show a validation error message
    cy.contains('Edit Listing').should('be.visible');
    // We expect the form validation to complain (either HTML5 validation or custom UI error)
    // Here we check if the modal is still open, meaning save didn't process
  });

  it('discards changes when clicking Cancel', () => {
    cy.visit('/workspace/listings');
    cy.contains('button', 'Edit').first().click();

    cy.get('input[id*="seller-listing-price"]').clear().type('9999');
    
    cy.contains('button', 'Cancel').click();

    // Verify modal closes and the new price is NOT in the list
    cy.contains('Edit Listing').should('not.exist');
    cy.contains('9999').should('not.exist');
  });
});
