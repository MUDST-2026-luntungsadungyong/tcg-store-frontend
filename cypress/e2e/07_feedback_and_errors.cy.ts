/// <reference types="cypress" />

describe('US-30: Feedback Popups & Error Handling UX', () => {
  const api = 'http://localhost:8080/api';

  const mockCharizardListing = {
    id: 'prd-14',
    cardId: 'prd-14',
    sellerId: '2',
    sellerName: 'Pokemon Master',
    name: 'Charizard VMAX',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/swsh45/SV107.png',
    price: 3200,
    cost: 2000,
    stock: 2,
    status: 'SHOW',
    set: 'Shining Fates',
    condition: 'Near Mint',
    marketPrice: 3500,
    rarity: 'Secret Rare',
    stage: 'VMAX',
  };

  const mockCharizardCatalogCard = {
    id: 'swsh45-SV107',
    name: 'Charizard VMAX',
    game: 'Pokemon',
    supertype: 'Pokémon',
    subtypes: 'VMAX',
    hp: '330',
    types: 'Fire',
    rarity: 'Secret Rare',
    setName: 'Shining Fates',
    cardNumber: 'SV107',
    imageSmall: 'https://images.pokemontcg.io/swsh45/sv107.png',
    imageLarge: 'https://images.pokemontcg.io/swsh45/sv107_hires.png',
    marketPrice: 3500,
  };

  const mockCollectionEntry = {
    id: 'col-1',
    ownerId: '1',
    listing: mockCharizardListing,
    quantity: 1,
    sourceOrderId: 'ord-1001',
    acquiredAt: new Date().toISOString(),
  };

  let cartItemCount = 0;

  const setupMockUser = () => {
    cy.clearLocalStorage();
    cy.clearCookies();
  };

  beforeEach(() => {
    cartItemCount = 0;
    setupMockUser();

    // 1. Products API for Card Detail (/cards/prd-14)
    cy.intercept('GET', `${api}/products/prd-14`, {
      statusCode: 200,
      body: mockCharizardListing,
    }).as('getCharizardDetail');

    cy.intercept('GET', `${api}/products*`, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          items: [mockCharizardListing],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 1,
          totalPages: 1,
          last: true,
        },
      });
    }).as('getProducts');

    // 2. Collection API
    cy.intercept('GET', `${api}/collection`, {
      statusCode: 200,
      body: {
        items: [mockCollectionEntry],
        page: { page: 0, size: 20, totalElements: 1, totalPages: 1 },
      },
    }).as('getCollection');

    cy.intercept('POST', `${api}/collection`, (req) => {
      req.reply({
        statusCode: 200,
        body: mockCollectionEntry,
      });
    }).as('addToCollection');

    cy.intercept('DELETE', `${api}/collection/*`, {
      statusCode: 200,
      body: { success: true },
    }).as('deleteCollection');

    // 3. Catalog cards API
    cy.intercept('GET', `${api}/cards*`, {
      statusCode: 200,
      body: [mockCharizardCatalogCard],
    }).as('searchCards');

    // 4. Cart API
    cy.intercept('GET', `${api}/cart`, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          items: cartItemCount > 0 ? [
            {
              listingId: 'prd-14',
              sellerId: '2',
              name: 'Charizard VMAX',
              game: 'Pokemon',
              image: 'https://images.pokemontcg.io/swsh45/SV107.png',
              price: 3200,
              condition: 'Near Mint',
              set: 'Shining Fates',
              rarity: 'Secret Rare',
              quantity: cartItemCount,
              available: true,
              availableQuantity: 2,
              subtotal: cartItemCount * 3200,
            }
          ] : [],
          totalItems: cartItemCount,
          totalAmount: cartItemCount * 3200,
        },
      });
    }).as('getCart');

    cy.intercept('POST', `${api}/cart/items`, (req) => {
      cartItemCount = req.body?.quantity ?? 1;
      req.reply({
        statusCode: 200,
        body: {
          items: [
            {
              listingId: 'prd-14',
              sellerId: '2',
              name: 'Charizard VMAX',
              game: 'Pokemon',
              image: 'https://images.pokemontcg.io/swsh45/SV107.png',
              price: 3200,
              condition: 'Near Mint',
              set: 'Shining Fates',
              rarity: 'Secret Rare',
              quantity: cartItemCount,
              available: true,
              availableQuantity: 2,
              subtotal: cartItemCount * 3200,
            }
          ],
          totalItems: cartItemCount,
          totalAmount: cartItemCount * 3200,
        },
      });
    }).as('addToCart');
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
    
    // Wait for the card to load (it should render Charizard VMAX)
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
    
    // Wait for dropdown to show results and click first item
    cy.get('[role="listbox"]').should('be.visible').find('button').first().click();

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

    // Wait for collection to load
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

    cy.intercept('GET', `${api}/cart`, {
      statusCode: 200,
      body: {
        items: [
          {
            listingId: 'prd-14',
            sellerId: '2',
            name: 'Charizard VMAX',
            game: 'Pokemon',
            image: 'https://images.pokemontcg.io/swsh45/SV107.png',
            price: 3200,
            condition: 'Near Mint',
            set: 'Shining Fates',
            rarity: 'Secret Rare',
            quantity: 1,
            available: true,
            availableQuantity: 2,
            subtotal: 3200,
          },
        ],
        totalItems: 1,
        totalAmount: 3200,
      },
    }).as('getCartWithCharizard');
    
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
