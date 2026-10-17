/// <reference types="cypress" />

describe('US-10: Collection and Leaderboard', () => {
  const api = 'http://localhost:8080/api';

  const mockPikachuCard = {
    id: 'base1-58',
    name: 'Pikachu',
    game: 'Pokemon',
    supertype: 'Pokémon',
    subtypes: 'Basic',
    hp: '40',
    types: 'Lightning',
    rarity: 'Common',
    setName: 'Base Set',
    cardNumber: '58',
    imageSmall: 'https://images.pokemontcg.io/base1/58.png',
    imageLarge: 'https://images.pokemontcg.io/base1/58_hires.png',
    marketPrice: 50,
  };

  const mockPikachuEntry = {
    id: 'col-pika-1',
    ownerId: '1',
    quantity: 1,
    sourceOrderId: 'ord-test-pika',
    acquiredAt: new Date().toISOString(),
    listing: {
      id: 'base1-58',
      sellerId: '',
      name: 'Pikachu',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/base1/58.png',
      price: 50,
      cost: 0,
      stock: 1,
      status: 'SHOW',
      condition: 'Near Mint',
      set: 'Base Set',
      rarity: 'Common',
      cardNumber: '58',
    },
  };

  beforeEach(() => {
    // Both parts can be tested with BUYER
    cy.loginByMock('BUYER');

    // Collection APIs
    cy.intercept('GET', `${api}/collection`, {
      statusCode: 200,
      body: {
        items: [],
        page: { page: 0, size: 20, totalElements: 0, totalPages: 0 },
      },
    }).as('getMyCollection');

    cy.intercept('GET', `${api}/cards*`, {
      statusCode: 200,
      body: [mockPikachuCard],
    }).as('searchCards');

    cy.intercept('POST', `${api}/collection*`, {
      statusCode: 200,
      body: mockPikachuEntry,
    }).as('addToCollection');

    cy.intercept('DELETE', `${api}/collection/*`, {
      statusCode: 200,
      body: { success: true },
    }).as('removeFromCollection');

    // Leaderboard & Products APIs on HomePage
    cy.intercept('GET', `${api}/products*`, {
      statusCode: 200,
      body: {
        items: [],
        totalElements: 0,
        totalPages: 0,
        pageNumber: 0,
        pageSize: 100,
        last: true,
      },
    }).as('getProducts');

    cy.intercept('GET', `${api}/collections/leaderboard*`, {
      statusCode: 200,
      body: [
        {
          rank: 1,
          userId: 'usr-ash',
          displayName: 'Ash Ketchum',
          avatarUrl: null,
          rareCardCount: 15,
          distinctRareCardCount: 12,
          highlights: [
            {
              cardId: 'crd-pika-illustrator',
              name: 'Pikachu Illustrator',
              imageUrl: 'https://images.pokemontcg.io/base1/58.png',
              rarity: 'Promo',
              quantity: 1,
            },
          ],
        },
        {
          rank: 2,
          userId: 'usr-misty',
          displayName: 'Misty Waterflower',
          avatarUrl: null,
          rareCardCount: 8,
          distinctRareCardCount: 6,
          highlights: [],
        },
      ],
    }).as('getLeaderboard');

    cy.intercept('GET', `${api}/collections/*`, {
      statusCode: 200,
      body: {
        owner: {
          userId: 'usr-ash',
          displayName: 'Ash Ketchum',
          avatarUrl: null,
          rareCardCount: 15,
          distinctRareCardCount: 12,
        },
        items: [mockPikachuEntry],
        page: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      },
    }).as('getPublicCollection');
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
