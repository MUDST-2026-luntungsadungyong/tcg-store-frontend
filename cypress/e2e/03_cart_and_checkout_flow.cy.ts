/// <reference types="cypress" />

describe('Core Journey 3: Shopping Cart Flow & Stock Verification (US-03)', () => {
  const mockMewListing = {
    id: 'prd-22',
    cardId: 'prd-22',
    sellerId: 'usr-3',
    sellerName: 'Pokemon Master',
    name: 'Mew',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/pop4/4.png',
    price: 320,
    cost: 180,
    stock: 5,
    status: 'SHOW',
    set: 'POP Series 4',
    condition: 'Near Mint',
    marketPrice: 350,
    rarity: 'Rare',
    stage: 'Basic',
  };

  let cartState = {
    items: [] as any[],
    totalItems: 0,
    totalAmount: 0,
  };

  beforeEach(() => {
    cartState = {
      items: [],
      totalItems: 0,
      totalAmount: 0,
    };

    cy.intercept('GET', '**/api/products*cardId=prd-22*', {
      statusCode: 200,
      body: {
        items: [mockMewListing],
        pageNumber: 0,
        pageSize: 100,
        totalElements: 1,
        totalPages: 1,
        last: true,
      },
    }).as('getMewListings');

    cy.intercept('GET', '**/api/products/prd-22', {
      statusCode: 200,
      body: mockMewListing,
    }).as('getMewProduct');

    cy.intercept('GET', '**/api/cards/prd-22', {
      statusCode: 200,
      body: {
        id: 'prd-22',
        name: 'Mew',
        game: 'Pokemon',
        rarity: 'Rare',
        stage: 'Basic',
        setName: 'POP Series 4',
        cardNumber: '4',
        imageLarge: 'https://images.pokemontcg.io/pop4/4.png',
        marketPrice: 350,
      },
    }).as('getMewCard');

    cy.intercept('GET', '**/api/cart', (req) => {
      req.reply({ statusCode: 200, body: cartState });
    }).as('getCart');

    cy.intercept('POST', '**/api/cart/items', (req) => {
      const { listingId, quantity = 1 } = req.body || {};
      const existing = cartState.items.find((i) => i.listingId === (listingId || 'prd-22'));
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, existing.availableQuantity);
        existing.subtotal = existing.price * existing.quantity;
      } else {
        cartState.items.push({
          listingId: 'prd-22',
          sellerId: 'usr-3',
          name: 'Mew',
          game: 'Pokemon',
          image: 'https://images.pokemontcg.io/pop4/4.png',
          price: 320,
          condition: 'Near Mint',
          set: 'POP Series 4',
          rarity: 'Rare',
          quantity: quantity,
          available: true,
          availableQuantity: 5,
          subtotal: 320 * quantity,
        });
      }
      cartState.totalItems = cartState.items.reduce((s, i) => s + i.quantity, 0);
      cartState.totalAmount = cartState.items.reduce((s, i) => s + i.subtotal, 0);
      req.reply({ statusCode: 200, body: cartState });
    }).as('addToCart');

    cy.intercept('PATCH', '**/api/cart/items/**', (req) => {
      const { quantity } = req.body || {};
      const urlParts = req.url.split('/');
      const listingId = decodeURIComponent(urlParts[urlParts.length - 1]);
      const item = cartState.items.find((i) => i.listingId === listingId) || cartState.items[0];
      if (item && quantity !== undefined) {
        item.quantity = Math.min(quantity, item.availableQuantity);
        item.subtotal = item.price * item.quantity;
      }
      cartState.totalItems = cartState.items.reduce((s, i) => s + i.quantity, 0);
      cartState.totalAmount = cartState.items.reduce((s, i) => s + i.subtotal, 0);
      req.reply({ statusCode: 200, body: cartState });
    }).as('updateCartItem');

    cy.intercept('DELETE', '**/api/cart/items/**', (req) => {
      cartState.items = [];
      cartState.totalItems = 0;
      cartState.totalAmount = 0;
      req.reply({ statusCode: 204, body: '' });
    }).as('removeCartItem');

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
    cy.contains(`Added 1 × ${mockMewListing.name} to your reservation cart.`).should('be.visible');

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
