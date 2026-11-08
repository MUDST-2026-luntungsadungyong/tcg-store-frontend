/// <reference types="cypress" />

describe('Core Journey 1: Home, Navigation & Card Discovery (US-02)', () => {
  beforeEach(() => {
    // This is a mock UI suite: discovery must not depend on the live catalog
    // or database latency, especially when asserting an empty search result.
    const listing = {
      id: 'navigation-pikachu', cardId: 'navigation-pikachu', sellerId: '2',
      name: 'Pikachu', game: 'Pokemon', image: '/assets/expensive_card_1.png',
      price: 50, stock: 5, status: 'SHOW', rarity: 'Rare', stage: 'Basic',
      condition: 'NM', set: 'Navigation test set',
    };
    cy.intercept('GET', '**/api/products*', (request) => {
      const query = String(request.query.search || '').toLowerCase();
      const items = listing.name.toLowerCase().includes(query) ? [listing] : [];
      request.reply({ items, pageNumber: 0, pageSize: 100, totalElements: items.length, totalPages: items.length ? 1 : 0, last: true });
    }).as('discoverListings');
    cy.intercept('GET', '**/api/collections/leaderboard*', { items: [] });
    cy.visit('/');
  });

  it('navigates to marketplace and searches by keyword', () => {
    cy.get('nav[aria-label="Marketplace navigation"] a[href="/cards"]').filter(':visible').should('have.length', 1).click();
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
