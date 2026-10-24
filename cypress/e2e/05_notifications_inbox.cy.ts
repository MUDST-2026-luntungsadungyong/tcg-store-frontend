/// <reference types="cypress" />

type NotificationDto = {
  id: number;
  type:
    | 'ORDER_RESERVED'
    | 'ORDER_STATUS_CHANGED'
    | 'SELLER_APPLICATION_SUBMITTED'
    | 'SELLER_APPLICATION_APPROVED'
    | 'SELLER_APPLICATION_REJECTED';
  title: string;
  message: string;
  orderId?: number | null;
  sellerApplicationId?: string | null;
  readAt: string | null;
  createdAt: string;
};

describe('Core Journey 5: In-App Notification Center (US-11)', () => {
  const profile = {
    id: 1,
    name: 'Buyer Demo',
    email: 'buyer@mythix.com',
    role: 'USER',
    sellerStatus: 'NONE',
  };

  const notification: NotificationDto = {
    id: 5,
    type: 'ORDER_STATUS_CHANGED',
    title: 'Your order has been sent',
    message: 'The seller marked order ORD-2026-0019 as sent.',
    orderId: 19,
    readAt: null,
    createdAt: '2026-09-20T10:00:00',
  };

  function page(content: NotificationDto[], totalElements = content.length, pageNumber = 0, pageSize = 20) {
    const totalPages = content.length ? Math.max(1, Math.ceil(totalElements / pageSize)) : 0;
    return {
      content,
      totalElements,
      totalPages,
      number: pageNumber,
      size: pageSize,
      first: pageNumber === 0,
      last: pageNumber >= totalPages - 1,
    };
  }

  beforeEach(() => {
    cy.intercept('GET', '**/api/users/profile', profile);
    cy.intercept('GET', '**/api/products*', {
      items: [],
      page: { page: 0, size: 100, totalElements: 0, totalPages: 0 },
    });
    cy.intercept('GET', '**/api/collections/leaderboard*', { items: [] });
    cy.intercept('GET', '**/api/cart', {
      items: [],
      totalItems: 0,
      totalAmount: 0,
    });
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'mock-jwt-token-customer');
      },
    });
    cy.get('a[aria-label^="Notifications"]').should('be.visible');
  });

  describe('US-11-2: Navbar Bell Icon & Unread Badges', () => {
    it('shows unread count badge in navbar matching unread notifications count', () => {
      cy.intercept('GET', '**/api/notifications/unread-count', (req) => {
        req.reply({ unreadCount: 5 });
      }).as('getUnreadCount');

      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', 'mock-jwt-token-customer');
        },
      });

      cy.get('a[aria-label="Notifications, 5 unread"]').should('be.visible');
      cy.get('a[aria-label="Notifications, 5 unread"] span[aria-hidden="true"]')
        .should('be.visible')
        .and('have.text', '5');
    });

    it('displays "99+" badge when unreadCount exceeds 99', () => {
      cy.intercept('GET', '**/api/notifications/unread-count', (req) => {
        req.reply({ unreadCount: 120 });
      }).as('getUnreadCount');

      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', 'mock-jwt-token-customer');
        },
      });

      cy.get('a[aria-label="Notifications, 120 unread"]').should('be.visible');
      cy.get('a[aria-label="Notifications, 120 unread"] span[aria-hidden="true"]')
        .should('be.visible')
        .and('have.text', '99+');
    });

    it('hides badge counter when there are 0 unread notifications', () => {
      cy.intercept('GET', '**/api/notifications/unread-count', (req) => {
        req.reply({ unreadCount: 0 });
      }).as('getUnreadCount');

      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', 'mock-jwt-token-customer');
        },
      });

      cy.get('a[aria-label="Notifications"]').should('be.visible');
      cy.get('a[aria-label="Notifications"] span[aria-hidden="true"]').should('not.exist');
    });

    it('keeps the bell visible for guests and redirects to login when clicked', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.clear();
          win.sessionStorage.clear();
        },
      });

      cy.get('a[aria-label="Notifications"]')
        .should('be.visible')
        .click({ force: true });

      cy.url().should('include', '/login');
      cy.get('#email').should('be.visible');
    });
  });

  describe('US-11-1: Inbox Actions & Deep-Link Navigations', () => {
    it('displays ORDER_RESERVED notification and action button', () => {
      const reservedNotification: NotificationDto = {
        id: 11,
        type: 'ORDER_RESERVED',
        title: 'New card reservation',
        message: 'Buyer reserved Charizard ex in order ORD-2026-0045.',
        orderId: 45,
        readAt: null,
        createdAt: '2026-10-14T10:00:00',
      };

      cy.intercept('GET', '**/api/notifications*', (req) => {
        req.reply(page([reservedNotification]));
      }).as('listNotifications');

      cy.intercept('PATCH', '**/api/notifications/11/read', (req) => {
        req.reply({ ...reservedNotification, readAt: '2026-10-14T10:05:00' });
      }).as('markRead');

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@listNotifications');

      cy.contains('h1', 'Notifications').should('be.visible');
      cy.contains('New card reservation').should('be.visible');
      cy.contains('Order #45').should('be.visible');
      cy.contains('button', 'View order').should('be.visible');
    });

    it('displays ORDER_STATUS_CHANGED notification and navigates to buyer orders on action click', () => {
      const statusNotification: NotificationDto = {
        id: 12,
        type: 'ORDER_STATUS_CHANGED',
        title: 'Your order has been sent',
        message: 'The seller marked order ORD-2026-0019 as sent.',
        orderId: 19,
        readAt: null,
        createdAt: '2026-10-14T10:00:00',
      };

      cy.intercept('GET', '**/api/notifications*', (req) => {
        req.reply(page([statusNotification]));
      }).as('listNotifications');

      cy.intercept('PATCH', '**/api/notifications/12/read', (req) => {
        req.reply({ ...statusNotification, readAt: '2026-10-14T10:05:00' });
      }).as('markRead');

      cy.intercept('GET', '**/api/orders*', { items: [], totalElements: 0 });

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@listNotifications');

      cy.contains('h1', 'Notifications').should('be.visible');
      cy.contains('Your order has been sent').should('be.visible');
      cy.contains('Order #19').should('be.visible');

      cy.contains('button', 'View order').should('be.visible').click();
      cy.wait('@markRead');
      cy.url().should('include', '/orders');
    });

    it('displays SELLER_APPLICATION_SUBMITTED notification with action button', () => {
      const appNotification: NotificationDto = {
        id: 13,
        type: 'SELLER_APPLICATION_SUBMITTED',
        title: 'New seller verification request',
        message: 'Applicant submitted seller application APP-88.',
        sellerApplicationId: 'APP-88',
        readAt: null,
        createdAt: '2026-10-14T10:00:00',
      };

      cy.intercept('GET', '**/api/notifications*', (req) => {
        req.reply(page([appNotification]));
      }).as('listNotifications');

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@listNotifications');

      cy.contains('New seller verification request').should('be.visible');
      cy.contains('Application #APP-88').should('be.visible');
      cy.contains('button', 'Review application').should('be.visible');
    });

    it('displays SELLER_APPLICATION_APPROVED notification and navigates to profile on action click', () => {
      const approvedNotification: NotificationDto = {
        id: 14,
        type: 'SELLER_APPLICATION_APPROVED',
        title: 'Store application approved!',
        message: 'Congratulations! Your seller application has been approved.',
        readAt: null,
        createdAt: '2026-10-14T10:00:00',
      };

      cy.intercept('GET', '**/api/notifications*', (req) => {
        req.reply(page([approvedNotification]));
      }).as('listNotifications');

      cy.intercept('PATCH', '**/api/notifications/14/read', (req) => {
        req.reply({ ...approvedNotification, readAt: '2026-10-14T10:05:00' });
      }).as('markRead');

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@listNotifications');

      cy.contains('Store application approved!').should('be.visible');

      cy.contains('button', 'View profile').should('be.visible').click();
      cy.wait('@markRead');
      cy.url().should('include', '/profile');
    });
  });

  describe('US-11-1 & US-11-2: Read, Delete & Dynamic Badge Lifecycle', () => {
    it('shows the navbar bell and completes the read/delete inbox flow', () => {
      let notifications = [notification];

      cy.intercept('GET', '**/api/notifications*', (request) => {
        request.reply(page(notifications));
      }).as('listNotifications');

      cy.intercept('PATCH', '**/api/notifications/5/read', (request) => {
        notifications = [{ ...notification, readAt: '2026-09-20T11:00:00' }];
        request.reply(notifications[0]);
      }).as('markNotificationRead');

      cy.intercept('DELETE', '**/api/notifications/5', (request) => {
        notifications = [];
        request.reply({ statusCode: 204 });
      }).as('deleteNotification');

      cy.get('a[aria-label^="Notifications"]')
        .should('be.visible')
        .and('have.attr', 'href', '/notifications');
      cy.get('a[aria-label^="Notifications"]').click({ force: true });

      cy.wait('@listNotifications');
      cy.url().should('include', '/notifications');
      cy.get('@listNotifications.all').its('length').should('be.gte', 1);
      cy.contains('h1', 'Notifications').should('be.visible');
      cy.contains('Your order has been sent').should('be.visible');
      cy.contains('The seller marked order ORD-2026-0019 as sent.').should('be.visible');
      cy.get('[aria-label="Unread"]').should('exist');

      cy.get('button[aria-label="Mark Your order has been sent as read"]').click();
      cy.wait('@markNotificationRead');
      cy.get('button[aria-label="Mark Your order has been sent as read"]').should('not.exist');
      cy.get('[aria-label="Read"]').should('exist');

      cy.get('button[aria-label="Delete Your order has been sent"]').click();
      cy.wait('@deleteNotification');
      cy.wait('@listNotifications');
      cy.contains('You’re all caught up').should('be.visible');
    });
  });

  describe('US-11-1: Pagination Support', () => {
    it('renders pagination controls and navigates between pages', () => {
      const page0Items: NotificationDto[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        type: 'ORDER_STATUS_CHANGED',
        title: `Order Update #${i + 1}`,
        message: `Status update message for order #${i + 1}`,
        orderId: i + 1,
        readAt: '2026-10-14T08:00:00',
        createdAt: '2026-10-14T08:00:00',
      }));

      const page1Items: NotificationDto[] = [
        {
          id: 21,
          type: 'ORDER_STATUS_CHANGED',
          title: 'Order Update #21',
          message: 'Status update message for order #21',
          orderId: 21,
          readAt: '2026-10-14T08:00:00',
          createdAt: '2026-10-14T08:00:00',
        },
      ];

      cy.intercept('GET', '**/api/notifications?page=0&size=20', (req) => {
        req.reply(page(page0Items, 21, 0, 20));
      }).as('getPage0');

      cy.intercept('GET', '**/api/notifications?page=1&size=20', (req) => {
        req.reply(page(page1Items, 21, 1, 20));
      }).as('getPage1');

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@getPage0');

      cy.get('nav[aria-label="Notifications pagination"]').should('be.visible');
      cy.contains('21 notifications').should('be.visible');
      cy.contains('Page 1 of 2').should('be.visible');

      cy.contains('button', 'Previous').should('be.disabled');
      cy.contains('button', 'Next').should('not.be.disabled').click();

      cy.wait('@getPage1');
      cy.contains('Page 2 of 2').should('be.visible');
      cy.contains('button', 'Next').should('be.disabled');
      cy.contains('button', 'Previous').should('not.be.disabled');
      cy.contains('Order Update #21').should('be.visible');
    });
  });

  describe('US-11-1: Error Handling & Authentication Guard', () => {
    it('shows a load error on 503 and retries the inbox successfully', () => {
      let attempts = 0;

      cy.intercept('GET', '**/api/notifications*', (request) => {
        attempts += 1;
        if (attempts === 1) {
          request.reply({ statusCode: 503, body: { message: 'notifications unavailable' } });
          return;
        }

        request.reply(page([notification]));
      }).as('listNotifications');

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@listNotifications').its('response.statusCode').should('eq', 503);
      cy.contains('[role="alert"]', 'We could not load your notifications. Please try again.').should('be.visible');

      cy.contains('button', 'Try again').click();
      cy.wait('@listNotifications').its('response.statusCode').should('eq', 200);
      cy.get('@listNotifications.all').its('length').should('be.gte', 2);
      cy.contains('Your order has been sent').should('be.visible');
    });

    it('shows expired session alert on 401 Unauthorized and offers Sign in redirection', () => {
      cy.intercept('GET', '**/api/notifications*', (req) => {
        req.reply({
          statusCode: 401,
          body: { message: 'Unauthorized' },
        });
      }).as('unauthorizedList');

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@unauthorizedList');

      cy.contains('[role="alert"]', 'Your session has expired. Sign in to view your notifications.').should('be.visible');
      cy.contains('button', 'Sign in').click();
      cy.url().should('include', '/login');
    });
  });

  describe('Visual & Bubble Card Styles', () => {
    it('renders notification cards using the shared dark panel surface', () => {
      cy.intercept('GET', '**/api/notifications*', (req) => {
        req.reply(page([notification]));
      }).as('listNotifications');

      cy.get('a[aria-label^="Notifications"]').click({ force: true });
      cy.wait('@listNotifications');
      cy.get('[aria-label="Notification list"] > li')
        .should('have.length', 1)
        .should('have.css', 'background-color', 'rgb(27, 35, 54)');
    });

    it('renders seller and similar cards using the shared dark panel surface', () => {
      const sellerOffer = {
        id: 'listing-1',
        cardId: 'prd-1',
        sellerId: 'seller-1',
        sellerName: 'Seller Demo',
        name: 'Pikachu VMAX',
        game: 'Pokemon',
        image: '/assets/expensive_card_1.png',
        price: 1200,
        cost: 800,
        stock: 3,
        status: 'SHOW',
        condition: 'NEAR_MINT',
        language: 'EN',
        set: 'Crown Zenith',
        rarity: 'Rare',
        stage: 'Basic',
      };
      const similarListing = {
        ...sellerOffer,
        id: 'listing-2',
        cardId: 'prd-2',
        sellerId: 'seller-2',
        sellerName: 'Similar Seller',
        name: 'Raichu V',
        price: 900,
      };

      cy.intercept('GET', '**/api/products*', (request) => {
        if (request.query.cardId === 'prd-1') {
          request.reply({
            items: [sellerOffer],
            pageNumber: 0,
            pageSize: 100,
            totalElements: 1,
            totalPages: 1,
            last: true,
          });
          return;
        }

        request.reply({
          items: [similarListing],
          pageNumber: 0,
          pageSize: 100,
          totalElements: 1,
          totalPages: 1,
          last: true,
        });
      }).as('listingRequests');

      cy.visit('/cards/prd-1');
      cy.contains('h2', 'Seller offers').should('be.visible');
      cy.get('section[aria-labelledby="seller-offers-heading"] article')
        .first()
        .should('have.css', 'background-color', 'rgb(27, 35, 54)');

      cy.contains('h2', 'Similar cards').should('be.visible');
      cy.get('section[aria-labelledby="similar-cards-heading"] a')
        .first()
        .should('have.css', 'background-color', 'rgb(27, 35, 54)');
    });
  });
});
