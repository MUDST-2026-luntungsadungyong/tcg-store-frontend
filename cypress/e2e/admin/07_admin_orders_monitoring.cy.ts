/// <reference types="cypress" />

describe('US-12-5: Platform-wide Order Logs Monitoring', () => {
  const adminUser = {
    id: 'usr-2',
    name: 'Admin Demo',
    email: 'admin@mythix.com',
    role: 'ADMIN',
    isSeller: false,
  };

  const customerUser = {
    id: 'usr-1',
    name: 'Ash Ketchum',
    email: 'ash@mythix.com',
    role: 'USER',
    isSeller: false,
  };

  const mockOrdersPage1 = {
    content: [
      {
        id: 'ord-101',
        orderNumber: 'ORD-2026-0001',
        buyerName: 'Ash Ketchum',
        buyerEmail: 'ash@mythix.com',
        status: 'PENDING',
        totalAmount: 3500.0,
        createdAt: '2026-10-14T10:00:00Z',
        platformFee: 350.0,
        sellerNetAmount: 3150.0,
        items: [
          {
            id: 'item-1',
            productName: 'Charizard VMAX (Secret Rare)',
            cardId: 'crd-swsh045-sv107',
            sellerName: 'Brock Pewter',
            sellerEmail: 'brock@pewtergym.com',
            shopName: 'Pewter Cards',
            price: 3500.0,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-102',
        orderNumber: 'ORD-2026-0002',
        buyerName: 'Misty Waterflower',
        buyerEmail: 'misty@cerulean.com',
        status: 'PAID',
        totalAmount: 1800.0,
        createdAt: '2026-10-13T14:30:00Z',
        platformFee: 180.0,
        sellerNetAmount: 1620.0,
        items: [
          {
            id: 'item-2',
            productName: 'Blastoise Base Set (Near Mint)',
            cardId: 'crd-base-2',
            sellerName: 'Gary Oak',
            sellerEmail: 'gary@oaklabs.com',
            shopName: 'Oak Vault',
            price: 900.0,
            quantity: 2,
          },
        ],
      },
      {
        id: 'ord-103',
        orderNumber: 'ORD-2026-0003',
        buyerName: 'Red Champion',
        buyerEmail: 'red@kanto.com',
        status: 'FULFILLED',
        totalAmount: 5000.0,
        createdAt: '2026-10-12T09:15:00Z',
        platformFee: 500.0,
        sellerNetAmount: 4500.0,
        items: [
          {
            id: 'item-3',
            productName: 'Pikachu Illustrator Promo',
            cardId: 'crd-promo-01',
            sellerName: 'Brock Pewter',
            sellerEmail: 'brock@pewtergym.com',
            shopName: 'Pewter Cards',
            price: 5000.0,
            quantity: 1,
          },
        ],
      },
      {
        id: 'ord-104',
        orderNumber: 'ORD-2026-0004',
        buyerName: 'Blue Oak',
        buyerEmail: 'blue@viridian.com',
        status: 'CANCELLED',
        totalAmount: 750.0,
        createdAt: '2026-10-11T16:45:00Z',
        platformFee: 75.0,
        sellerNetAmount: 675.0,
        items: [
          {
            id: 'item-4',
            productName: 'Gengar EX (Played)',
            cardId: 'crd-phantom-34',
            sellerName: 'Gary Oak',
            sellerEmail: 'gary@oaklabs.com',
            shopName: 'Oak Vault',
            price: 750.0,
            quantity: 1,
          },
        ],
      },
    ],
    number: 0,
    totalPages: 2,
    totalElements: 5,
  };

  const mockOrdersPage2 = {
    content: [
      {
        id: 'ord-105',
        orderNumber: 'ORD-2026-0005',
        buyerName: 'Lance Dragon',
        buyerEmail: 'lance@indigoplateau.com',
        status: 'FULFILLED',
        totalAmount: 12000.0,
        createdAt: '2026-10-10T11:00:00Z',
        platformFee: 1200.0,
        sellerNetAmount: 10800.0,
        items: [
          {
            id: 'item-5',
            productName: 'Dragonite 1st Edition Holo',
            cardId: 'crd-fossil-4',
            sellerName: 'Brock Pewter',
            sellerEmail: 'brock@pewtergym.com',
            shopName: 'Pewter Cards',
            price: 12000.0,
            quantity: 1,
          },
        ],
      },
    ],
    number: 1,
    totalPages: 2,
    totalElements: 5,
  };

  const seedMockStorage = (win: Cypress.AUTWindow, role: 'ADMIN' | 'CUSTOMER' | 'GUEST') => {
    // Ensure mock users table exists
    const users = [
      customerUser,
      adminUser,
      { id: 'usr-3', name: 'Brock Pewter', email: 'seller@mythix.com', role: 'USER', isSeller: true },
    ];
    win.localStorage.setItem('mythix_mock_users_v6', JSON.stringify(users));

    if (role === 'ADMIN') {
      win.localStorage.setItem('token', 'mock-jwt-token-admin');
      win.localStorage.setItem(
        'tcg_auth_storage',
        JSON.stringify({
          state: { token: 'mock-jwt-token-admin', user: adminUser, isAuthenticated: true },
          version: 0,
        })
      );
    } else if (role === 'CUSTOMER') {
      win.localStorage.setItem('token', 'mock-jwt-token-customer');
      win.localStorage.setItem(
        'tcg_auth_storage',
        JSON.stringify({
          state: { token: 'mock-jwt-token-customer', user: customerUser, isAuthenticated: true },
          version: 0,
        })
      );
    } else {
      win.localStorage.removeItem('token');
      win.localStorage.removeItem('tcg_auth_storage');
    }
  };

  describe('Route Protection & Access Control', () => {
    it('redirects unauthenticated guest trying to access /admin/orders to /login', () => {
      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });
      cy.url().should('include', '/login');
      cy.contains('Welcome back!').should('be.visible');
    });

    it('redirects non-admin authenticated user trying to access /admin/orders to /', () => {
      cy.loginByMock('CUSTOMER');
      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'CUSTOMER');
        },
      });
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('allows authenticated ADMIN to access /admin/orders and see Admin Layout', () => {
      cy.intercept('GET', '**/api/admin/orders*', {
        statusCode: 200,
        body: mockOrdersPage1,
      }).as('getOrders');

      cy.loginByMock('ADMIN');
      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.wait('@getOrders');

      cy.url().should('include', '/admin/orders');
      cy.contains('p', 'Platform administration').should('be.visible');
      cy.contains('h1', 'Order logs').should('be.visible');
      cy.contains('a', 'Order monitoring').should('have.attr', 'href', '/admin/orders');
    });
  });

  describe('Order Logs Table Presentation & Loading States', () => {
    beforeEach(() => {
      cy.loginByMock('ADMIN');
    });

    it('shows loading skeleton while fetching orders data', () => {
      cy.intercept('GET', '**/api/admin/orders*', (req) => {
        req.on('response', (res) => {
          res.setDelay(800);
        });
      }).as('getOrdersDelay');

      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.contains('p', 'Loading orders…').should('be.visible');
      cy.get('[role="status"].animate-pulse').should('be.visible');
      cy.wait('@getOrdersDelay');
    });

    it('renders desktop table with all columns, formatted amounts, and badges', () => {
      cy.intercept('GET', '**/api/admin/orders*', {
        statusCode: 200,
        body: mockOrdersPage1,
      }).as('getOrders');

      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.wait('@getOrders');

      // Verify total count
      cy.contains('5 orders found').should('be.visible');

      // Table headers
      cy.get('table thead').within(() => {
        cy.contains('th', 'Order').should('be.visible');
        cy.contains('th', 'Buyer').should('be.visible');
        cy.contains('th', 'Seller').should('be.visible');
        cy.contains('th', 'Status').should('be.visible');
        cy.contains('th', 'Date').should('be.visible');
        cy.contains('th', 'Amount').should('be.visible');
      });

      // Check rows
      cy.get('table tbody tr').should('have.length', 4);

      // Row 1: Ash Ketchum (PENDING)
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('td', 'ORD-2026-0001').should('be.visible');
        cy.contains('td', 'Ash Ketchum').should('be.visible');
        cy.contains('td', 'Pewter Cards').should('be.visible');
        cy.contains('span', 'PENDING').should('be.visible');
        cy.contains('td', '฿3,500.00').should('be.visible');
      });

      // Row 2: Misty Waterflower (PAID)
      cy.get('table tbody tr').eq(1).within(() => {
        cy.contains('td', 'ORD-2026-0002').should('be.visible');
        cy.contains('td', 'Misty Waterflower').should('be.visible');
        cy.contains('td', 'Oak Vault').should('be.visible');
        cy.contains('span', 'PAID').should('be.visible');
        cy.contains('td', '฿1,800.00').should('be.visible');
      });

      // Row 3: Red Champion (FULFILLED)
      cy.get('table tbody tr').eq(2).within(() => {
        cy.contains('td', 'ORD-2026-0003').should('be.visible');
        cy.contains('td', 'Red Champion').should('be.visible');
        cy.contains('span', 'FULFILLED').should('be.visible');
        cy.contains('td', '฿5,000.00').should('be.visible');
      });

      // Row 4: Blue Oak (CANCELLED)
      cy.get('table tbody tr').eq(3).within(() => {
        cy.contains('td', 'ORD-2026-0004').should('be.visible');
        cy.contains('td', 'Blue Oak').should('be.visible');
        cy.contains('span', 'CANCELLED').should('be.visible');
        cy.contains('td', '฿750.00').should('be.visible');
      });
    });
  });

  describe('Search & Filter Capabilities', () => {
    beforeEach(() => {
      cy.loginByMock('ADMIN');
      cy.intercept('GET', '**/api/admin/orders*', {
        statusCode: 200,
        body: mockOrdersPage1,
      }).as('getOrdersInitial');

      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.wait('@getOrdersInitial');
    });

    it('filters orders by clicking status pills (toggle and multi-select)', () => {
      cy.intercept('GET', '**/api/admin/orders*', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            content: [mockOrdersPage1.content[0]],
            number: 0,
            totalPages: 1,
            totalElements: 1,
          },
        });
      }).as('getFilteredPending');

      // Click PENDING pill
      cy.contains('button', 'PENDING').click();
      cy.wait('@getFilteredPending').its('request.url').should('include', 'statuses=PENDING');
      cy.contains('button', 'PENDING').should('have.attr', 'aria-pressed', 'true');

      // Click CANCELLED pill to multi-select
      cy.intercept('GET', '**/api/admin/orders*', {
        statusCode: 200,
        body: {
          content: [mockOrdersPage1.content[0], mockOrdersPage1.content[3]],
          number: 0,
          totalPages: 1,
          totalElements: 2,
        },
      }).as('getFilteredMulti');

      cy.contains('button', 'CANCELLED').click();
      cy.wait('@getFilteredMulti');
      cy.contains('button', 'CANCELLED').should('have.attr', 'aria-pressed', 'true');

      // Click PENDING again to deselect
      cy.contains('button', 'PENDING').click();
      cy.contains('button', 'PENDING').should('have.attr', 'aria-pressed', 'false');
    });

    it('searches by query and clears search input', () => {
      // 1. Search by Order Number (default)
      cy.intercept('GET', '**/api/admin/orders*query=ORD-2026-0001*', {
        statusCode: 200,
        body: {
          content: [mockOrdersPage1.content[0]],
          number: 0,
          totalPages: 1,
          totalElements: 1,
        },
      }).as('searchOrderNumber');

      cy.get('input[placeholder="Search order number"]').type('ORD-2026-0001', { delay: 0 });
      cy.wait('@searchOrderNumber').then((interception) => {
        expect(interception.request.url).to.include('query=ORD-2026-0001');
        expect(interception.request.url).to.include('searchBy=ORDER_NUMBER');
      });

      // Clear search button should appear
      cy.get('button[aria-label="Clear search"]').should('be.visible').click();
      cy.get('input[placeholder="Search order number"]').should('have.value', '');

      // 2. Change Search By to BUYER
      cy.get('select[aria-label="Search by"]').select('BUYER');
      cy.get('input[placeholder="Search buyer name or email"]').should('be.visible');

      cy.intercept('GET', '**/api/admin/orders*query=Ash*', {
        statusCode: 200,
        body: {
          content: [mockOrdersPage1.content[0]],
          number: 0,
          totalPages: 1,
          totalElements: 1,
        },
      }).as('searchBuyer');

      cy.get('input[placeholder="Search buyer name or email"]').type('Ash', { delay: 0 });
      cy.wait('@searchBuyer').then((interception) => {
        expect(interception.request.url).to.include('query=Ash');
        expect(interception.request.url).to.include('searchBy=BUYER');
      });

      // 3. Change Search By to SELLER
      cy.get('button[aria-label="Clear search"]').click();
      cy.get('select[aria-label="Search by"]').select('SELLER');
      cy.get('input[placeholder="Search seller or store"]').should('be.visible');
    });

    it('opens and closes the date range filter picker', () => {
      cy.contains('5 orders found').should('be.visible');
      cy.get('button[aria-label="Select order date range"]').should('be.visible').click();
      cy.get('button[aria-label="Select order date range"]').should('have.attr', 'aria-expanded', 'true');

      // Date picker popover should be visible
      cy.contains('button', 'Clear').should('be.visible');
      cy.contains('button', 'Apply').should('be.visible');

      // Clear closes and resets
      cy.contains('button', 'Clear').click();
      cy.get('button[aria-label="Select order date range"]').should('have.attr', 'aria-expanded', 'false');
    });
  });

  describe('Order Details Modal', () => {
    beforeEach(() => {
      cy.loginByMock('ADMIN');
      cy.intercept('GET', '**/api/admin/orders*', {
        statusCode: 200,
        body: mockOrdersPage1,
      }).as('getOrders');

      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.wait('@getOrders');
    });

    it('opens order details modal on row click, displays complete order information, and closes', () => {
      cy.contains('5 orders found').should('be.visible');

      // Click on row 1 (Ash Ketchum, ORD-2026-0001)
      cy.contains('td', 'ORD-2026-0001').click();

      // Modal should appear
      cy.get('#modal-title').closest('[role="dialog"]').should('be.visible').within(() => {
        cy.contains('#modal-title', 'Order details').should('be.visible');
        cy.contains('h2', 'ORD-2026-0001').should('be.visible');
        cy.contains('span', 'PENDING').should('be.visible');

        // Order Information
        cy.contains('Order information').should('be.visible');
        cy.contains('ord-101').should('be.visible');

        // Buyer Information
        cy.contains('Buyer').should('be.visible');
        cy.contains('Ash Ketchum').should('be.visible');
        cy.contains('ash@mythix.com').should('be.visible');

        // Financial Summary
        cy.contains('Financial summary').should('be.visible');
        cy.contains('฿3,500.00').should('be.visible');
        cy.contains('฿350.00').should('be.visible');
        cy.contains('฿3,150.00').should('be.visible');

        // Item List
        cy.contains('Items (1)').should('be.visible');
        cy.contains('Charizard VMAX (Secret Rare)').should('be.visible');
        cy.contains('Card ID: crd-swsh045-sv107').should('be.visible');
        cy.contains('Brock Pewter').should('be.visible');
        cy.contains('Pewter Cards').should('be.visible');
        cy.contains('Qty: 1').should('be.visible');
        cy.contains('Subtotal: ฿3,500.00').should('be.visible');

        // Click Close Button
        cy.get('button[aria-label="Close modal"]').click();
      });

      // Modal is closed
      cy.get('#modal-title').should('not.exist');
      cy.get('[data-testid="modal-backdrop"]').should('not.exist');
    });
  });

  describe('Pagination & Refresh Handling', () => {
    beforeEach(() => {
      cy.loginByMock('ADMIN');
    });

    it('handles pagination between multiple pages correctly', () => {
      cy.intercept('GET', '**/api/admin/orders*page=0*', {
        statusCode: 200,
        body: mockOrdersPage1,
      }).as('getPage0');

      cy.intercept('GET', '**/api/admin/orders*page=1*', {
        statusCode: 200,
        body: mockOrdersPage2,
      }).as('getPage1');

      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.wait('@getPage0');

      // Verify Page 1 pagination state
      cy.contains('Page 1 of 2').should('be.visible');
      cy.contains('button', 'Previous').should('be.disabled');
      cy.contains('button', 'Next').should('not.be.disabled');

      // Click Next
      cy.contains('button', 'Next').click();
      cy.wait('@getPage1');

      // Verify Page 2 pagination state
      cy.contains('Page 2 of 2').should('be.visible');
      cy.contains('button', 'Previous').should('not.be.disabled');
      cy.contains('button', 'Next').should('be.disabled');
      cy.contains('td', 'ORD-2026-0005').should('be.visible');
      cy.contains('td', 'Lance Dragon').should('be.visible');

      // Click Previous
      cy.contains('button', 'Previous').click();
      cy.wait('@getPage0');
      cy.contains('Page 1 of 2').should('be.visible');
      cy.contains('td', 'ORD-2026-0001').should('be.visible');
    });

    it('refetches orders when Refresh button is clicked', () => {
      cy.intercept('GET', '**/api/admin/orders*', {
        statusCode: 200,
        body: mockOrdersPage1,
      }).as('getOrders');

      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.wait('@getOrders');

      // Click Refresh button
      cy.contains('button', 'Refresh').click();
      cy.wait('@getOrders');
      cy.contains('5 orders found').should('be.visible');
    });

    it('renders empty state when no orders exist', () => {
      cy.intercept('GET', '**/api/admin/orders*', {
        statusCode: 200,
        body: {
          content: [],
          number: 0,
          totalPages: 0,
          totalElements: 0,
        },
      }).as('getEmptyOrders');

      cy.visit('/admin/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'ADMIN');
        },
      });
      cy.wait('@getEmptyOrders');

      cy.contains('0 orders found').should('be.visible');
      cy.get('table tbody tr').should('have.length', 0);
    });
  });
});
