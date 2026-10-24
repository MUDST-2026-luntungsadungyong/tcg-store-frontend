/// <reference types="cypress" />

// Isolated read fixtures: no real accounts, reservations or profile writes.
describe('Design system: responsive content and accessible feedback', () => {
  const cardName = 'Charizard Special Illustration Rare Collector Edition With An Exceptionally Long Card Name';
  const listing = {
    id: 'design-offer', cardId: 'design-card', sellerId: '2',
    sellerName: 'Collector store with a long descriptive name', name: cardName,
    game: 'Pokemon', image: '/assets/expensive_card_1.png', price: 3200,
    stock: 2, status: 'SHOW', set: 'Collector Edition', condition: 'Near Mint',
    rarity: 'Rare', stage: 'Basic',
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/products*', {
      items: [listing], pageNumber: 0, pageSize: 20,
      totalElements: 1, totalPages: 1, last: true,
    });
    cy.intercept('GET', '**/api/products/design-card', listing);
    cy.intercept('GET', '**/api/cards/design-card', {
      id: 'design-card', name: cardName, game: 'Pokemon', rarity: 'Rare',
      setName: 'Collector Edition', imageLarge: listing.image,
    });
  });

  it('contains a ten-collector homepage rail without expanding the document', () => {
    cy.intercept('GET', '**/api/collections/leaderboard*', {
      items: Array.from({ length: 10 }, (_, index) => ({
        rank: index + 1, userId: `collector-${index + 1}`,
        displayName: `Collector ${index + 1}`, rareCardCount: 20 - index,
        distinctRareCardCount: 10, highlights: [],
      })),
    }).as('homeLeaderboard');
    cy.visit('/');
    cy.wait('@homeLeaderboard');
    cy.get('[data-testid="home-collector-rail"] article').should('have.length', 10);
    for (const width of [1280, 390]) {
      cy.viewport(width, 900);
      cy.document().should((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth + 1);
      });
      cy.get('[data-testid="home-collector-rail"]')
        .scrollIntoView().scrollTo('left').scrollTo('right')
        .should(($rail) => expect($rail[0].scrollLeft).to.be.greaterThan(0));
      cy.get('[data-testid="home-collector-rail"] article').last()
        .contains('View public collection').should('be.visible');
    }
  });

  it('keeps long card content and search controls inside a 390px viewport', () => {
    cy.viewport(390, 844);
    cy.visit('/cards');
    cy.contains('h3', cardName).should('be.visible');
    cy.get('[data-testid="search-input"]').should('be.visible');
    cy.get('[data-testid="search-button"]').should('be.visible');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth + 1);
    });
    cy.screenshot('design-browse-mobile-long-name', { capture: 'viewport' });
  });

  it('keeps keyboard focus inside contextual login and restores its trigger', () => {
    cy.viewport(1280, 900);
    cy.visit('/cards/design-card');
    cy.contains('button', /^Collect/).as('collect').click();
    cy.get('[role="alertdialog"]').as('dialog').should('be.visible');
    cy.get('@dialog').children().first().should('have.css', 'background-color', 'rgb(27, 35, 54)');
    cy.get('@dialog').find('button').first().should('have.focus');
    // Exercise the focus boundary handled by the dialog's native key listener.
    cy.get('@dialog').find('button').last().focus().trigger('keydown', { key: 'Tab' });
    cy.get('@dialog').find('button').first().should('have.focus');
    cy.get('@dialog').find('button').first().trigger('keydown', { key: 'Tab', shiftKey: true });
    cy.get('@dialog').find('button').last().should('have.focus');
    cy.screenshot('design-contextual-login-keyboard', { capture: 'viewport' });
    cy.get('@dialog').contains('button', 'Not now').click();
    cy.get('[role="alertdialog"]').should('not.exist');
    cy.get('@collect').should('have.focus');
  });

  it('announces copied contact, pauses dismissal while focused and supports explicit dismiss', () => {
    const user = { id: '1', name: 'Test CUSTOMER', email: 'customer@mythix.com', role: 'USER', isSeller: false, phone: '0812345678' };
    cy.loginByMock('CUSTOMER');
    cy.intercept('GET', '**/auth/me', user);
    cy.intercept('GET', '**/api/users/profile', user);
    cy.visit('/profile', {
      onBeforeLoad(win) {
        const saved = JSON.parse(win.localStorage.getItem('tcg_auth_storage') || '{}');
        saved.state = { ...saved.state, user };
        win.localStorage.setItem('tcg_auth_storage', JSON.stringify(saved));
        Object.defineProperty(win.navigator, 'clipboard', {
          configurable: true, value: { writeText: cy.stub().resolves().as('clipboardWrite') },
        });
      },
    });
    cy.get('button[aria-label="Copy phone number"]').should('be.enabled');
    // Keep animation's real clock running while controlling dismissal timers.
    cy.clock(Date.now(), ['setTimeout', 'clearTimeout']);
    cy.get('button[aria-label="Copy phone number"]').click();
    cy.get('@clipboardWrite').should('have.been.calledWith', user.phone);
    cy.get('section[aria-label="Notifications"] [role="status"]').should('contain.text', 'Phone copied to clipboard.');
    cy.get('button[aria-label="Dismiss notification"]').focus();
    cy.tick(9000);
    cy.get('section[aria-label="Notifications"] [role="status"]').should('be.visible');
    cy.get('section[aria-label="Notifications"] [role="status"]').parent().should('have.css', 'opacity', '1');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth + 1);
    });
    cy.screenshot('design-profile-focused-toast', { capture: 'viewport' });
    cy.get('button[aria-label="Dismiss notification"]').click();
    cy.tick(500);
    cy.get('section[aria-label="Notifications"] [role="status"]').should('not.exist');
  });
});
