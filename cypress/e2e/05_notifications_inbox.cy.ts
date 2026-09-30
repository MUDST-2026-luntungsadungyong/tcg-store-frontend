/// <reference types="cypress" />

type NotificationDto = {
  id: number;
  type: 'ORDER_RESERVED' | 'ORDER_STATUS_CHANGED';
  title: string;
  message: string;
  orderId: number;
  readAt: string | null;
  createdAt: string;
};

describe('Notification inbox', () => {
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

  function page(content: NotificationDto[]) {
    return {
      content,
      totalElements: content.length,
      totalPages: content.length ? 1 : 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
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
    cy.get('a[aria-label="Notifications"]').should('be.visible');
  });

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

    cy.get('a[aria-label="Notifications"]')
      .should('be.visible')
      .and('have.attr', 'href', '/notifications');
    cy.get('a[aria-label="Notifications"]').click({ force: true });

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

    cy.screenshot('notifications-inbox-read-state', { capture: 'fullPage' });

    cy.get('button[aria-label="Delete Your order has been sent"]').click();
    cy.wait('@deleteNotification');
    cy.wait('@listNotifications');
    cy.contains('You’re all caught up').should('be.visible');
  });

  it('shows a load error and retries the inbox successfully', () => {
    let attempts = 0;

    cy.intercept('GET', '**/api/notifications*', (request) => {
      attempts += 1;
      if (attempts === 1) {
        request.reply({ statusCode: 503, body: { message: 'notifications unavailable' } });
        return;
      }

      request.reply(page([notification]));
    }).as('listNotifications');

    cy.get('a[aria-label="Notifications"]').click({ force: true });
    cy.wait('@listNotifications').its('response.statusCode').should('eq', 503);
    cy.contains('[role="alert"]', 'We could not load your notifications. Please try again.').should('be.visible');

    cy.contains('button', 'Try again').click();
    cy.wait('@listNotifications').its('response.statusCode').should('eq', 200);
    cy.get('@listNotifications.all').its('length').should('be.gte', 2);
    cy.contains('Your order has been sent').should('be.visible');
  });

  it('renders notification cards as white bubbles', () => {
    cy.intercept('GET', '**/api/notifications*', page([notification])).as('listNotifications');
    cy.get('a[aria-label="Notifications"]').click({ force: true });
    cy.wait('@listNotifications');
    cy.get('[aria-label="Notification list"] > li')
      .should('have.length', 1)
      .should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('renders seller and similar cards as white bubbles', () => {
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
      .should('have.css', 'background-color', 'rgb(255, 255, 255)');

    cy.contains('h2', 'Similar cards').should('be.visible');
    cy.get('section[aria-labelledby="similar-cards-heading"] a')
      .first()
      .should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });

  it('keeps the bell visible for guests and redirects the protected inbox to login', () => {
    cy.clearLocalStorage();
    cy.visit('/');

    cy.get('a[aria-label="Notifications"]')
      .should('be.visible')
      .click({ force: true });

    cy.url().should('include', '/login');
    cy.get('#email').should('be.visible');
  });
});
