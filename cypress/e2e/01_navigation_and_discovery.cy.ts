/// <reference types="cypress" />

describe('Core Journey 1: Home, Navigation & Card Discovery (US-02)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('navigates to marketplace and searches by keyword', () => {
    cy.get('a[href="/cards"]').first().click({ force: true });
    cy.url().should('include', '/cards');
    
    // Search by keyword
    cy.get('input[data-testid="search-input"]').first().clear().type('Pikachu');
    cy.get('button[data-testid="search-button"]').click();
    
    // Wait for mock data to resolve and display the items
    cy.contains('Pikachu').should('be.visible');
  });

  it('filters by rarity, stage, condition, and in-stock', () => {
    cy.visit('/cards');
    
    // Rarity
    cy.contains('button', 'Rarity:').click();
    cy.contains('button', 'Rare').click();
    cy.get('body').click(0, 0); // Click away to close dropdown
    
    // Stage
    cy.contains('button', 'Stage:').click();
    cy.contains('button', 'Basic').click();
    cy.get('body').click(0, 0); 
    
    // Condition
    cy.contains('button', 'Condition:').click();
    cy.contains('button', 'Mint').click();
    cy.get('body').click(0, 0); 
    
    // In stock
    cy.contains('label', 'In Stock Only').click();

    cy.get('button[data-testid="search-button"]').click();
    // After search, filter tags should appear
    cy.contains('Rarity: Rare').should('be.visible');
    cy.contains('Stage: Basic').should('be.visible');
    cy.contains(/Condition:.*Mint/i).should('be.visible');
  });

  it('filters by valid price range', () => {
    cy.visit('/cards');
    cy.get('input[data-testid="min-price-input"]').clear().type('10');
    cy.get('input[data-testid="max-price-input"]').clear().type('100');
    cy.get('button[data-testid="search-button"]').click();
    cy.contains(/Price:.*10.*100/i).should('be.visible');
  });

  it('shows error on invalid price range (Min > Max)', () => {
    cy.visit('/cards');
    cy.get('input[data-testid="min-price-input"]').clear().type('500');
    cy.get('input[data-testid="max-price-input"]').clear().type('100');
    
    // search-button is disabled, error should appear automatically
    cy.get('[data-testid="price-error-msg"]').should('contain.text', 'Min price cannot be greater than Max price');
  });

  it('displays not found message when search yields no results', () => {
    cy.visit('/cards');
    cy.get('input[data-testid="search-input"]').first().clear().type('NonExistentCardName123');
    cy.get('button[data-testid="search-button"]').click();
    cy.get('[data-testid="empty-state"]').should('be.visible');
    cy.contains('No cards found').should('be.visible');
  });

  it('protects the notifications inbox from unauthenticated users', () => {
    cy.visit('/notifications');
    cy.url().should('include', '/login');
    cy.get('#email').should('be.visible');
  });
});
