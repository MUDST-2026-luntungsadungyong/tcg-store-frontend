/// <reference types="cypress" />

describe('Core Journey 3: Shopping Cart Flow & Stock Verification (US-03)', () => {
  beforeEach(() => {
    // Seed initial product
    cy.visit('/cards/prd-22'); // Mew - POP Series 4 (Near Mint)
  });

  it('prompts unauthenticated user to login when adding to cart', () => {
    // Guest view
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('tcg_auth_storage');
    cy.visit('/cards/prd-22');
    
    cy.contains(/Add to reservation cart/i).click();
    // Modal or toast prompting login
    cy.contains(/Log in to collect or reserve cards/i).should('be.visible');
  });

  it('allows authenticated buyer to add to cart and manage quantity', () => {
    cy.loginByMock('CUSTOMER');
    cy.visit('/cards/prd-22');
    
    // Add to cart
    cy.contains(/Add to reservation cart/i).click();
    cy.contains(/Added to cart|Success|reserved/i).should('be.visible');

    // Go to cart
    cy.visit('/cart');
    cy.url().should('include', '/cart');
    
    // Manage quantity
    cy.get('button[aria-label*="Increase"]').first().click();
    
    // Delete item
    cy.get('button[aria-label*="Remove"]').first().click();
    cy.contains(/Cart is empty|No items|0 items/i).should('be.visible');
  });

  it('prevents adding quantity beyond available stock', () => {
    cy.loginByMock('CUSTOMER');
    cy.visit('/cards/prd-22'); // Stock is 5
    cy.contains(/Add to reservation cart/i).click();
    cy.visit('/cart');
    
    // Stock is 8, click increase 10 times to ensure we hit the limit
    for (let i = 0; i < 10; i++) {
      cy.get('button[aria-label*="Increase"]').first().click({force: true});
    }
    
    // Check disabled state on the button
    cy.get('button[aria-label*="Increase"]').first().should('be.disabled');
  });
});
