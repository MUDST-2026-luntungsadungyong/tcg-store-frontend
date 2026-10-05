/// <reference types="cypress" />

describe('US-04-2 & US-09: Buyer Order History, Direct Buy, and Filtering', () => {
  beforeEach(() => {
    cy.loginByMock('CUSTOMER');
    window.localStorage.setItem('token', 'mock-jwt-token-customer');
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
    cy.contains('My Orders').should('be.visible');

    // 3. Test filtering: The mock DB should have some orders loaded
    // Initially on 'All' tab
    cy.contains('button', 'All').should('have.class', 'bg-[#EFA025]');
    
    // Click 'Pending / Confirmed' tab
    cy.contains('button', 'Pending / Confirmed').click();
    cy.contains('button', 'Pending / Confirmed').should('have.class', 'bg-[#EFA025]');
    cy.contains(/Order ID & Date|No orders found/).should('be.visible');

    // Click 'Sent' tab
    cy.contains('button', 'Sent').click();
    cy.contains('button', 'Sent').should('have.class', 'bg-[#EFA025]');
    cy.contains(/Order ID & Date|No orders found/).should('be.visible');

    // Click 'Cancelled' tab
    cy.contains('button', 'Cancelled').click();
    cy.contains('button', 'Cancelled').should('have.class', 'bg-[#EFA025]');
    cy.contains(/Order ID & Date|No orders found/).should('be.visible');

    // Go back to 'All'
    cy.contains('button', 'All').click();
    
    // Test opening order details
    // If there is an order, click "View Details"
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("View Details")').length > 0) {
        cy.contains('button', 'View Details').first().click();
        
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
