/// <reference types="cypress" />

describe('US-07-1 & US-07-2: Seller Order Management & Profit Dashboard', () => {
  const sellerUser = {
    id: 'usr-3',
    name: 'Brock Pewter',
    email: 'seller@mythix.com',
    role: 'USER',
    isSeller: true,
    sellerStatus: 'VERIFIED',
    phone: '0899998888',
  };

  const customerUser = {
    id: 'usr-1',
    name: 'Ash Ketchum',
    email: 'ash@mythix.com',
    phone: '0811112222',
    line: 'ash_line',
    facebook: 'Ash Facebook',
    role: 'USER',
    isSeller: false,
  };

  const buyer2 = {
    id: 'usr-2',
    name: 'Misty Waterflower',
    email: 'misty@cerulean.com',
    phone: '0822223333',
    line: 'misty_line',
    role: 'USER',
    isSeller: false,
  };

  const buyer3 = {
    id: 'usr-4',
    name: 'Gary Oak',
    email: 'gary@oaklabs.com',
    role: 'USER',
    isSeller: false,
  };

  const testListings = [
    {
      id: 'crd-001',
      sellerId: 'usr-3',
      name: 'Charizard VMAX (Secret Rare)',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/sv3/125.png',
      price: 3500,
      cost: 1500,
      stock: 5,
      status: 'SHOW',
      condition: 'Near Mint',
      set: 'Champions Path',
      rarity: 'Secret Rare',
    },
    {
      id: 'crd-002',
      sellerId: 'usr-3',
      name: 'Starmie GX Holo',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/sm9/67.png',
      price: 1000,
      cost: 400,
      stock: 2,
      status: 'SHOW',
      condition: 'Mint',
      set: 'Team Up',
      rarity: 'Holo Rare',
    },
    {
      id: 'crd-003',
      sellerId: 'usr-3',
      name: 'Pikachu V Full Art',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/swsh4/43.png',
      price: 500,
      cost: 300,
      stock: 1,
      status: 'SHOW',
      condition: 'Near Mint',
      set: 'Vivid Voltage',
      rarity: 'Ultra Rare',
    },
    {
      id: 'crd-004',
      sellerId: 'usr-3',
      name: 'Eevee Promo',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/promo/11.png',
      price: 300,
      cost: 300,
      stock: 4,
      status: 'SHOW',
      condition: 'Played',
      set: 'Promo',
      rarity: 'Common',
    },
  ];

  const createInitialOrders = () => [
    {
      id: 'ord-test-01',
      orderNumber: 'ORD-2026-0001',
      buyerId: 'usr-1',
      sellerId: 'usr-3',
      status: 'PENDING',
      items: [{ listing: testListings[0], quantity: 1 }],
      totalAmount: 3500,
      createdAt: '2026-10-14T10:00:00Z',
      logs: [
        {
          fromStatus: null,
          toStatus: 'PENDING',
          changedByRole: 'BUYER',
          note: 'Reservation created',
          createdAt: '2026-10-14T10:00:00Z',
        },
      ],
    },
    {
      id: 'ord-test-02',
      orderNumber: 'ORD-2026-0002',
      buyerId: 'usr-2',
      sellerId: 'usr-3',
      status: 'CONFIRMED',
      items: [{ listing: testListings[1], quantity: 1 }],
      totalAmount: 1000,
      createdAt: '2026-10-13T14:00:00Z',
      paymentConfirmedAt: '2026-10-13T14:30:00Z',
      logs: [
        {
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          changedByRole: 'SELLER',
          note: 'Payment slip verified',
          createdAt: '2026-10-13T14:30:00Z',
        },
      ],
    },
    {
      id: 'ord-test-03',
      orderNumber: 'ORD-2026-0003',
      buyerId: 'usr-1',
      sellerId: 'usr-3',
      status: 'SENT',
      items: [{ listing: testListings[2], quantity: 1 }],
      totalAmount: 500,
      createdAt: '2026-10-12T09:00:00Z',
      sentAt: '2026-10-12T11:00:00Z',
      logs: [
        {
          fromStatus: 'CONFIRMED',
          toStatus: 'SENT',
          changedByRole: 'SELLER',
          note: 'Shipped via EMS',
          createdAt: '2026-10-12T11:00:00Z',
        },
      ],
    },
    {
      id: 'ord-test-04',
      orderNumber: 'ORD-2026-0004',
      buyerId: 'usr-4',
      sellerId: 'usr-3',
      status: 'CANCELLED',
      items: [{ listing: testListings[3], quantity: 1 }],
      totalAmount: 300,
      createdAt: '2026-10-11T12:00:00Z',
      cancelledAt: '2026-10-11T13:00:00Z',
      logs: [
        {
          fromStatus: 'PENDING',
          toStatus: 'CANCELLED',
          changedByRole: 'SELLER',
          note: 'Cancelled due to non-response',
          createdAt: '2026-10-11T13:00:00Z',
        },
      ],
    },
  ];

  const seedMockStorage = (win: Cypress.AUTWindow, role: 'SELLER' | 'CUSTOMER' | 'GUEST', orders?: any[]) => {
    const users = [
      customerUser,
      buyer2,
      buyer3,
      { id: 'usr-admin', name: 'Admin Demo', email: 'admin@mythix.com', role: 'ADMIN', isSeller: false },
      sellerUser,
    ];
    win.localStorage.setItem('mythix_mock_users_v6', JSON.stringify(users));
    win.localStorage.setItem('mythix_mock_listings_v2', JSON.stringify(testListings));
    win.localStorage.setItem('mythix_mock_reservations_v1', JSON.stringify(orders ?? createInitialOrders()));

    if (role === 'SELLER') {
      win.localStorage.setItem('token', 'mock-jwt-token-seller');
      win.localStorage.setItem(
        'tcg_auth_storage',
        JSON.stringify({
          state: { token: 'mock-jwt-token-seller', user: sellerUser, isAuthenticated: true },
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

  describe('Route Protection & Role Guards', () => {
    it('redirects unauthenticated guest trying to access /workspace/orders to /login', () => {
      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });
      cy.url().should('include', '/login');
      cy.contains('Welcome back!').should('be.visible');
    });

    it('redirects non-seller authenticated customer trying to access /workspace/orders to /', () => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: customerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: customerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'CUSTOMER');
        },
      });
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('allows verified SELLER to access /workspace/orders and see Workspace Layout', () => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: sellerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: sellerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'SELLER');
        },
      });

      cy.url().should('include', '/workspace/orders');
      cy.contains('h1', 'Seller Order Management & Profit Dashboard').should('be.visible');
      cy.contains('a', 'Reservation orders').should('have.attr', 'href', '/workspace/orders');
    });
  });

  describe('Profit KPI Cards & Table Presentation (US-06-1 & US-07-1)', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: sellerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: sellerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'SELLER');
        },
      });
      cy.contains('h1', 'Seller Order Management & Profit Dashboard').should('be.visible');
    });

    it('displays summary KPI cards with revenue, cost, profit, and order breakdown', () => {
      // 1. Total Sales (Revenue) - active orders: 3500 + 1000 + 500 = 5000
      cy.contains('Total Sales (Revenue)').should('be.visible');
      cy.contains('฿5,000.00').should('be.visible');

      // 2. Total Cost - active orders: 1500 + 400 + 300 = 2200
      cy.contains('Total Cost').should('be.visible');
      cy.contains('฿2,200.00').should('be.visible');

      // 3. Net Profit - 5000 - 2200 = 2800
      cy.contains('Net Profit (กำไรสุทธิ)').should('be.visible');
      cy.contains('฿2,800.00').should('be.visible');

      // 4. Orders Overview - 4 total, 2 pending (1 pending + 1 confirmed), 1 sent, 1 cancelled
      cy.contains('Orders Overview').should('be.visible');
      cy.contains('span', '4').should('be.visible');
      cy.contains('2 Pending').should('be.visible');
      cy.contains('1 Sent').should('be.visible');
      cy.contains('1 Cancelled').should('be.visible');
    });

    it('renders orders table headers and order items correctly', () => {
      // Table headers
      cy.get('table thead').within(() => {
        cy.contains('th', 'Order Details').should('be.visible');
        cy.contains('th', 'Customer').should('be.visible');
        cy.contains('th', 'Items Reserved').should('be.visible');
        cy.contains('th', 'Financials').should('be.visible');
        cy.contains('th', 'Status').should('be.visible');
        cy.contains('th', 'Actions').should('be.visible');
      });

      // Rows count
      cy.get('table tbody tr').should('have.length', 4);

      // Row 1: ORD-2026-0001 (PENDING)
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('ORD-2026-0001').should('be.visible');
        cy.contains('Ash Ketchum').should('be.visible');
        cy.contains('Charizard VMAX (Secret Rare)').should('be.visible');
        cy.contains('Near Mint').should('be.visible');
        cy.contains('฿3,500').should('be.visible');
        cy.contains('Cost: ฿1,500').should('be.visible');
        cy.contains('Profit: +฿2,000').should('be.visible');
        cy.contains('Pending').should('be.visible');
        cy.contains('button', 'Confirm Payment').should('be.visible');
        cy.contains('button', 'Cancel Order').should('be.visible');
      });

      // Row 2: ORD-2026-0002 (CONFIRMED)
      cy.get('table tbody tr').eq(1).within(() => {
        cy.contains('ORD-2026-0002').should('be.visible');
        cy.contains('Misty Waterflower').should('be.visible');
        cy.contains('Starmie GX Holo').should('be.visible');
        cy.contains('Mint').should('be.visible');
        cy.contains('฿1,000').should('be.visible');
        cy.contains('Confirmed').should('be.visible');
        cy.contains('button', 'Mark as Sent').should('be.visible');
        cy.contains('button', 'Cancel Order').should('be.visible');
      });

      // Row 3: ORD-2026-0003 (SENT)
      cy.get('table tbody tr').eq(2).within(() => {
        cy.contains('ORD-2026-0003').should('be.visible');
        cy.contains('Ash Ketchum').should('be.visible');
        cy.contains('Pikachu V Full Art').should('be.visible');
        cy.contains('Sent').should('be.visible');
      });

      // Row 4: ORD-2026-0004 (CANCELLED)
      cy.get('table tbody tr').eq(3).within(() => {
        cy.contains('ORD-2026-0004').should('be.visible');
        cy.contains('Gary Oak').should('be.visible');
        cy.contains('Eevee Promo').should('be.visible');
        cy.contains('Cancelled').should('be.visible');
      });
    });
  });

  describe('Search & Status Filtering (US-07-1)', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: sellerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: sellerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'SELLER');
        },
      });
      cy.contains('h1', 'Seller Order Management & Profit Dashboard').should('be.visible');
    });

    it('filters orders by clicking status filter tabs', () => {
      // 1. Click Pending tab -> shows PENDING and CONFIRMED orders (ORD-01 and ORD-02)
      cy.contains('button', 'Pending').click();
      cy.get('table tbody tr').should('have.length', 2);
      cy.contains('ORD-2026-0001').should('be.visible');
      cy.contains('ORD-2026-0002').should('be.visible');
      cy.contains('ORD-2026-0003').should('not.exist');
      cy.contains('ORD-2026-0004').should('not.exist');

      // 2. Click Sent tab -> shows SENT orders (ORD-03)
      cy.contains('button', 'Sent').click();
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('ORD-2026-0003').should('be.visible');
      cy.contains('ORD-2026-0001').should('not.exist');

      // 3. Click Cancelled tab -> shows CANCELLED orders (ORD-04)
      cy.contains('button', 'Cancelled').click();
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('ORD-2026-0004').should('be.visible');
      cy.contains('ORD-2026-0002').should('not.exist');

      // 4. Click All Orders tab -> shows all 4 orders
      cy.contains('button', 'All Orders').click();
      cy.get('table tbody tr').should('have.length', 4);
    });

    it('searches orders by order number, customer name, and item name in client search input', () => {
      // Search by order number
      cy.get('input[placeholder*="Search order"]').type('ORD-2026-0002');
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('Misty Waterflower').should('be.visible');

      // Clear search
      cy.get('input[placeholder*="Search order"]').clear();
      cy.get('table tbody tr').should('have.length', 4);

      // Search by card name
      cy.get('input[placeholder*="Search order"]').type('Charizard');
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('ORD-2026-0001').should('be.visible');

      // Search by customer name
      cy.get('input[placeholder*="Search order"]').clear().type('Gary');
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('Gary Oak').should('be.visible');
    });
  });

  describe('Order Details & Customer Contact Modal (US-07-1)', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: sellerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: sellerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'SELLER');
        },
      });
      cy.contains('h1', 'Seller Order Management & Profit Dashboard').should('be.visible');
    });

    it('opens Order Details modal, displays contact channels, items, and timeline, then closes', () => {
      // Click Order Details button on Row 1
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('button', 'Order Details').click();
      });

      // Modal appears
      cy.get('#modal-title').should('contain.text', 'Order Details - ORD-2026-0001');

      // Customer info
      cy.contains('Customer Name').should('be.visible');
      cy.contains('Ash Ketchum').should('be.visible');
      cy.contains('0811112222').should('be.visible');
      cy.contains('ash_line').should('be.visible');
      cy.contains('Ash Facebook').should('be.visible');

      // Items breakdown in modal
      cy.contains('Reserved Items (1)').should('be.visible');
      cy.contains('Charizard VMAX (Secret Rare)').should('be.visible');
      cy.contains('+฿2,000 profit').should('be.visible');

      // Order timeline
      cy.contains('Order Timeline').should('be.visible');
      cy.contains('PENDING').should('be.visible');
      cy.contains('by BUYER').should('be.visible');
      cy.contains('"Reservation created"').should('be.visible');

      // Close modal
      cy.contains('button', 'Close').click();
      cy.get('#modal-title').should('not.exist');
    });
  });

  describe('Order Status Update Actions (US-07-2)', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: sellerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: sellerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'SELLER');
        },
      });
      cy.contains('h1', 'Seller Order Management & Profit Dashboard').should('be.visible');
    });

    it('updates order status from PENDING to CONFIRMED via Payment Confirmation popup', () => {
      // Click Confirm Payment on Row 1 (ORD-2026-0001)
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('button', 'Confirm Payment').click();
      });

      // FeedbackPopup opens (CASE 10a)
      cy.get('[role="alertdialog"]').should('be.visible').within(() => {
        cy.contains('Confirm payment received?').should('be.visible');
        cy.contains('Only confirm after the buyer has paid you outside Mythix.').should('be.visible');
        cy.contains('button', 'Confirm payment').click();
      });

      // FeedbackPopup closes
      cy.get('[role="alertdialog"]').should('not.exist');

      // Status should now be Confirmed and action button should now show "Mark as Sent"
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('Confirmed').should('be.visible');
        cy.contains('button', 'Mark as Sent').should('be.visible');
      });
    });

    it('updates order status from CONFIRMED to SENT via Mark Sent popup', () => {
      // Click Mark as Sent on Row 2 (ORD-2026-0002)
      cy.get('table tbody tr').eq(1).within(() => {
        cy.contains('button', 'Mark as Sent').click();
      });

      // FeedbackPopup opens (CASE 10b)
      cy.get('[role="alertdialog"]').should('be.visible').within(() => {
        cy.contains('Mark this order as sent?').should('be.visible');
        cy.contains('This transfers card ownership to the buyer\'s collection.').should('be.visible');
        cy.contains('button', 'Mark as sent').click();
      });

      // FeedbackPopup closes
      cy.get('[role="alertdialog"]').should('not.exist');

      // Status badge should update to Sent
      cy.get('table tbody tr').eq(1).within(() => {
        cy.contains('Sent').should('be.visible');
      });
    });

    it('cancels an order with cancellation note and validates input requirement', () => {
      // Click Cancel Order on Row 1
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('button', 'Cancel Order').click();
      });

      // Cancel Modal opens
      cy.get('#modal-title').should('contain.text', 'Cancel Order');
      cy.contains('Please provide a reason for cancelling this order').should('be.visible');

      // Submit button should be disabled when empty
      cy.get('button').filter(':contains("Cancel Order")').last().should('be.disabled');

      // Type reason
      const reason = 'Buyer unreachable after 24h external settlement limit';
      cy.get('textarea[placeholder="Reason for cancellation..."]').type(reason);
      cy.get('button').filter(':contains("Cancel Order")').last().should('not.be.disabled').click();

      // Modal closes
      cy.get('#modal-title').should('not.exist');

      // Row status should update to Cancelled
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('Cancelled').should('be.visible');
      });

      // Check that the cancellation note appears in the order details timeline
      cy.get('table tbody tr').eq(0).within(() => {
        cy.contains('button', 'Order Details').click();
      });
      cy.get('#modal-title').should('contain.text', 'Order Details - ORD-2026-0001');
      cy.contains(`"${reason}"`).should('be.visible');
      cy.contains('button', 'Close').click();
    });
  });

  describe('Empty State & Refresh Handling', () => {
    it('renders empty state when seller has no orders', () => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: sellerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: sellerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'SELLER', []);
        },
      });

      cy.contains('No orders found matching criteria').should('be.visible');
      cy.contains('Check back later or try adjusting filters.').should('be.visible');
    });

    it('reloads data when Refresh button is clicked', () => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: sellerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: sellerUser });

      cy.visit('/workspace/orders', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'SELLER');
        },
      });
      cy.contains('h1', 'Seller Order Management & Profit Dashboard').should('be.visible');

      cy.contains('button', 'Refresh').click();
      cy.contains('ORD-2026-0001').should('be.visible');
    });
  });
});
