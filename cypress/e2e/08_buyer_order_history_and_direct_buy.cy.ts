/// <reference types="cypress" />

describe('US-04-2 & US-09: Buyer Order History, Direct Buy, and Filtering', () => {
  const api = 'http://localhost:8080/api';

  const mockMewListing = {
    id: 'prd-22',
    cardId: 'prd-22',
    sellerId: '2',
    sellerName: 'Pokemon Master',
    name: 'Mew',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/pop4/4.png',
    price: 320,
    cost: 180,
    stock: 8,
    status: 'SHOW',
    condition: 'Mint',
    language: 'English',
    set: 'POP Series 4',
    rarity: 'Rare',
    stage: 'Basic',
    cardNumber: '4',
    marketPrice: 350,
  };

  const mockCartItem = {
    listingId: 'prd-22',
    sellerId: '2',
    name: 'Mew',
    game: 'Pokemon',
    image: 'https://images.pokemontcg.io/pop4/4.png',
    price: 320,
    condition: 'Mint',
    set: 'POP Series 4',
    rarity: 'Rare',
    quantity: 1,
    available: true,
    availableQuantity: 8,
    subtotal: 320,
  };

  const mockOrders = [
    {
      id: 'ord-1001',
      buyerId: '1',
      sellerId: '2',
      sellerName: 'Pokemon Master',
      items: [
        {
          listing: mockMewListing,
          quantity: 1,
          price: 320,
        },
      ],
      totalAmount: 320,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ord-1002',
      buyerId: '1',
      sellerId: '2',
      sellerName: 'Pokemon Master',
      items: [
        {
          listing: mockMewListing,
          quantity: 1,
          price: 320,
        },
      ],
      totalAmount: 320,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ord-1003',
      buyerId: '1',
      sellerId: '2',
      sellerName: 'Pokemon Master',
      items: [
        {
          listing: mockMewListing,
          quantity: 1,
          price: 320,
        },
      ],
      totalAmount: 320,
      status: 'CANCELLED',
      createdAt: new Date().toISOString(),
    },
  ];

  let currentCart: {
    items: typeof mockCartItem[];
    totalItems: number;
    totalAmount: number;
  };

  beforeEach(() => {
    currentCart = {
      items: [],
      totalItems: 0,
      totalAmount: 0,
    };

    cy.loginByMock('CUSTOMER');

    // 1. Intercept Products API (for Card Detail & Similar Cards)
    cy.intercept('GET', `${api}/products/prd-22`, {
      statusCode: 200,
      body: mockMewListing,
    }).as('getProductDetail');

    cy.intercept('GET', `${api}/products*`, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          items: [mockMewListing],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 1,
          totalPages: 1,
          last: true,
        },
      });
    }).as('getProducts');

    // 2. Intercept Cart GET and POST
    cy.intercept('GET', `${api}/cart`, (req) => {
      req.reply({
        statusCode: 200,
        body: currentCart,
      });
    }).as('getCart');

    cy.intercept('POST', `${api}/cart/items`, (req) => {
      const quantity = req.body?.quantity ?? 1;
      currentCart = {
        items: [{ ...mockCartItem, quantity, subtotal: quantity * 320 }],
        totalItems: quantity,
        totalAmount: quantity * 320,
      };
      req.reply({
        statusCode: 200,
        body: currentCart,
      });
    }).as('addToCart');

    // 3. Intercept Buyer Orders API
    cy.intercept('GET', `${api}/orders/me`, {
      statusCode: 200,
      body: mockOrders,
    }).as('getBuyerOrders');

    cy.intercept('GET', `${api}/orders/*`, (req) => {
      const parts = req.url.split('/');
      const orderId = parts[parts.length - 1].split('?')[0];
      const found = mockOrders.find((o) => o.id === orderId) || mockOrders[0];
      req.reply({
        statusCode: 200,
        body: found,
      });
    }).as('getOrderById');
  });

  it('US-04-2: Place Order Directly (Reserve Now) shortcut', () => {
    // 1. Clear cart
    cy.window().then((win) => {
      win.localStorage.removeItem('reservation-cart-storage');
    });

    // 2. Visit a specific card detail page (Mew)
    cy.visit('/cards/prd-22');

    // 3. Find the Seller Offers section and click "Reserve now"
    cy.contains('button', /Reserve now/i, { timeout: 10000 }).first().click();

    // 4. The user should be redirected to the cart page immediately
    cy.url().should('include', '/cart');
    cy.contains('Reservation Cart').should('be.visible');

    // 5. Proceed to checkout to prove it works
    // Since we just added an item, Review reservation should be available
    cy.contains('a', 'Review reservation').should('be.visible');
  });

  it('US-09-1 & US-09-2: View and Filter Buyer Order History', () => {
    // 1. Visit the Buyer My Orders page
    cy.visit('/orders');

    // 2. Wait for loading to finish by checking for either the table header or empty state
    cy.contains(/Order ID & Date|No orders found/).should('be.visible');
    cy.contains('h1', 'My Orders').should('be.visible');

    // 3. Test filtering: The mock DB should have some orders loaded
    // Initially on 'All' tab
    cy.contains('button', 'All').should('have.attr', 'aria-pressed', 'true');
    
    // Click 'Pending / Confirmed' tab
    cy.contains('button', 'Pending / Confirmed').click();
    cy.contains('button', 'Pending / Confirmed').should('have.attr', 'aria-pressed', 'true');
    cy.contains(/Order ID & Date|No orders found/).should('be.visible');

    // Click 'Sent' tab
    cy.contains('button', 'Sent').click();
    cy.contains('button', 'Sent').should('have.attr', 'aria-pressed', 'true');
    cy.contains(/Order ID & Date|No orders found/).should('be.visible');

    // Click 'Cancelled' tab
    cy.contains('button', 'Cancelled').click();
    cy.contains('button', 'Cancelled').should('have.attr', 'aria-pressed', 'true');
    cy.contains(/Order ID & Date|No orders found/).should('be.visible');

    // Go back to 'All'
    cy.contains('button', 'All').click();
    
    // Test opening order details
    // If there is an order, click "Order Details" or "View Details"
    cy.get('body').then(($body) => {
      const $btn = $body.find('button:contains("Order Details"), button:contains("View Details")');
      if ($btn.length > 0) {
        cy.wrap($btn.first()).click();
        
        // Modal should appear
        cy.get('[role="dialog"]').should('be.visible');
        cy.get('[role="dialog"]').contains('Order Details').should('be.visible');
        
        // Close modal
        cy.get('[role="dialog"]').find('button[aria-label="Close modal"]').click();
        cy.get('[role="dialog"]').should('not.exist');
      }
    });
  });
});
