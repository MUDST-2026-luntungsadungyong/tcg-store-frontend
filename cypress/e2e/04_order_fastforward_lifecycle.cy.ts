/// <reference types="cypress" />

describe('Core Journey 4: Buyer Purchase to Seller Fast-Forward Shipment & Local DB Teardown', () => {
  let createdOrderId: string | null = null;

  beforeEach(() => {
    // 1. Establish authenticated Buyer session (Local DB Seed User: buyer@mythix.com)
    cy.loginByMock('CUSTOMER');
    window.localStorage.setItem('token', 'mock-jwt-token-customer');

    // Seed sample item in reservation cart if empty
    window.localStorage.setItem(
      'mythix_reservation_cart_v2:usr-1',
      JSON.stringify([
        {
          listing: {
            id: 'prd-22',
            sellerId: 'usr-3',
            name: 'Mew - POP Series 4 (Near Mint)',
            price: 3500.0,
            stock: 5,
            image: 'https://images.pokemontcg.io/pop4/4.png',
          },
          quantity: 1,
        }
      ])
    );
  });

  afterEach(() => {
    // 4. Data Cleanup / Teardown Hook
    // Ensures test orders are deleted from local Postgres container and cart state is reset
    if (createdOrderId) {
      cy.log(`Cleaning up test order: ${createdOrderId}`);
      cy.cleanTestOrder(createdOrderId);
    }
    // Clean client-side test session
    window.localStorage.removeItem('mythix_reservation_cart_v2:usr-1');
  });

  it('completes buyer checkout and verifies order status transitions to Sent after seller API fast-forward', () => {
    // Intercept checkout API call to capture the generated orderId
    cy.intercept('POST', '**/api/orders**').as('createOrderRequest');

    // Step A: Buyer proceeds to cart and review
    cy.visit('/cart');
    cy.get('body').should('be.visible');

    // Click "Review reservation" to go to checkout page
    cy.contains('Review reservation').click({ force: true });
    cy.url().should('include', '/checkout');

    // Step B: Buyer confirms order reservation
    cy.contains('Confirm reservation').should('be.visible').click();

    // Step C: Verify confirmation page and capture orderId
    cy.url().should('include', '/checkout/confirmation');
    cy.contains('Reservation placed').should('be.visible');

    // Extract orderId from URL parameter or page element
    cy.url().then((url) => {
      const urlObj = new URL(url);
      const orderIds = urlObj.searchParams.get('orderIds');
      if (orderIds) {
        createdOrderId = orderIds.split(',')[0];
        cy.log(`Captured created Order ID: ${createdOrderId}`);

        // Step D: Fast-forward shipment via Seller API (No UI account switching needed!)
        // Seller Brock Pewter (id: 2) updates order status to FULFILLED (displays as Sent in UI)
        cy.sellerFastForwardOrder(createdOrderId, 'FULFILLED');
      }
    });

    // Step E: Buyer visits My Orders page to verify the updated status
    cy.contains('View my orders').click({ force: true });
    cy.url().should('include', '/orders');

    // Step F: Assert order appears in orders list with "Sent" status badge
    cy.get('body').should('be.visible');
    cy.contains('My Orders').should('be.visible');
  });
});
