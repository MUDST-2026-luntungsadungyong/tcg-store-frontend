/// <reference types="cypress" />

describe('US-02-2 & US-02-3: Card Detail Multi-Seller Comparison & Recommendations', () => {
  const customerUser = {
    id: 'usr-1',
    name: 'Ash Ketchum',
    email: 'ash@mythix.com',
    role: 'USER',
    isSeller: false,
    phone: '0811112222',
  };

  const mockUsers = [
    customerUser,
    {
      id: 'usr-2',
      name: 'Misty Waterflower',
      email: 'misty@cerulean.com',
      role: 'USER',
      isSeller: true,
      sellerStatus: 'VERIFIED',
      phone: '0822223333',
    },
    {
      id: 'usr-3',
      name: 'Brock Pewter',
      email: 'seller@mythix.com',
      role: 'USER',
      isSeller: true,
      sellerStatus: 'VERIFIED',
      phone: '0899998888',
    },
    {
      id: 'usr-gary',
      name: 'Gary Oak',
      email: 'gary@oaklabs.com',
      role: 'USER',
      isSeller: true,
      sellerStatus: 'VERIFIED',
      phone: '0855556666',
    },
  ];

  const mockListings = [
    // Offer 1 for Charizard VMAX (lowest price)
    {
      id: 'offer-chz-01',
      cardId: 'crd-charizard-vmax',
      sellerId: 'usr-3',
      sellerName: 'Brock Pewter',
      name: 'Charizard VMAX',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/swsh45/sv107.png',
      price: 3200,
      cost: 1500,
      stock: 3,
      status: 'SHOW',
      condition: 'Near Mint',
      language: 'Japanese',
      set: "Champion's Path",
      rarity: 'Secret Rare',
      stage: 'VMAX',
      cardNumber: '074/073',
      year: 2020,
      gradingCompany: 'PSA (Professional Sports Authenticator)',
      grade: 'Near Mint-Mint 8',
      tournament: 'Special League',
      certNumber: '79170302',
      cardText: 'Japanese tournament champion description',
    },
    // Offer 2 for Charizard VMAX (mid price)
    {
      id: 'offer-chz-02',
      cardId: 'crd-charizard-vmax',
      sellerId: 'usr-2',
      sellerName: 'Misty Waterflower',
      name: 'Charizard VMAX',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/swsh45/sv107.png',
      price: 3500,
      cost: 1600,
      stock: 2,
      status: 'SHOW',
      condition: 'Lightly Played',
      language: 'English',
      set: "Champion's Path",
      rarity: 'Secret Rare',
      stage: 'VMAX',
      cardNumber: '074/073',
    },
    // Offer 3 for Charizard VMAX (highest price, out of stock)
    {
      id: 'offer-chz-03',
      cardId: 'crd-charizard-vmax',
      sellerId: 'usr-gary',
      sellerName: 'Gary Oak',
      name: 'Charizard VMAX',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/swsh45/sv107.png',
      price: 4000,
      cost: 2000,
      stock: 0,
      status: 'SHOW',
      condition: 'Mint',
      language: 'English',
      set: "Champion's Path",
      rarity: 'Secret Rare',
      stage: 'VMAX',
      cardNumber: '074/073',
    },
    // Similar Card 1: Rayquaza VMAX (same rarity 'Secret Rare', same stage 'VMAX')
    {
      id: 'offer-ray-01',
      cardId: 'crd-rayquaza-vmax',
      sellerId: 'usr-3',
      sellerName: 'Brock Pewter',
      name: 'Rayquaza VMAX',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/swsh7/218.png',
      price: 2500,
      cost: 1200,
      stock: 1,
      status: 'SHOW',
      condition: 'Near Mint',
      language: 'English',
      set: 'Evolving Skies',
      rarity: 'Secret Rare',
      stage: 'VMAX',
      cardNumber: '218/203',
    },
    // Similar Card 2: Umbreon VMAX (same rarity 'Secret Rare', same stage 'VMAX')
    {
      id: 'offer-umb-01',
      cardId: 'crd-umbreon-vmax',
      sellerId: 'usr-2',
      sellerName: 'Misty Waterflower',
      name: 'Umbreon VMAX',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/swsh7/215.png',
      price: 4500,
      cost: 2500,
      stock: 2,
      status: 'SHOW',
      condition: 'Mint',
      language: 'Japanese',
      set: 'Evolving Skies',
      rarity: 'Secret Rare',
      stage: 'VMAX',
      cardNumber: '215/203',
    },
    // Card with zero SHOW offers (catalog only / hidden offer)
    {
      id: 'offer-mew-01',
      cardId: 'crd-mew-promo',
      sellerId: 'usr-3',
      sellerName: 'Brock Pewter',
      name: 'Mew Ancient Promo',
      game: 'Pokemon',
      image: 'https://images.pokemontcg.io/promo/8.png',
      price: 999,
      cost: 500,
      stock: 0,
      status: 'HIDE',
      condition: 'Near Mint',
      set: 'Promo',
      rarity: 'Promo',
      stage: 'Basic',
    },
  ];

  const seedMockStorage = (win: Cypress.AUTWindow, role: 'CUSTOMER' | 'GUEST') => {
    win.localStorage.setItem('mythix_mock_users_v6', JSON.stringify(mockUsers));
    win.localStorage.setItem('mythix_mock_listings_v2', JSON.stringify(mockListings));

    if (role === 'CUSTOMER') {
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

  describe('Card Details & Metadata Presentation', () => {
    beforeEach(() => {
      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });
      cy.contains('h1', 'Charizard VMAX').should('be.visible');
    });

    it('renders breadcrumbs, title, 3D card visual, and card specifications correctly', () => {
      // Breadcrumb navigation
      cy.get('nav[aria-label="Breadcrumb"]').within(() => {
        cy.contains('a', 'Cards').should('have.attr', 'href', '/cards');
        cy.contains('Charizard VMAX').should('be.visible');
      });

      // Heading
      cy.contains('h1', 'Charizard VMAX').should('be.visible');

      // Card details section
      cy.contains('h2', 'Card details').should('be.visible');
      cy.contains('Card Number / Rarity:').should('be.visible');
      cy.contains('074/073 / Secret Rare').should('be.visible');
      cy.contains('Card Text:').should('be.visible');
      cy.contains('Japanese tournament champion description').should('be.visible');
      cy.contains('Grading Company:').should('be.visible');
      cy.contains('PSA (Professional Sports Authenticator)').should('be.visible');
      cy.contains('Grade:').should('be.visible');
      cy.contains('Near Mint-Mint 8').should('be.visible');
      cy.contains('Year:').should('be.visible');
      cy.contains('2020').should('be.visible');
      cy.contains('Card Set:').should('be.visible');
      cy.contains("Champion's Path").should('be.visible');
      cy.contains('Tournament:').should('be.visible');
      cy.contains('Special League').should('be.visible');
      cy.contains('Certification Number:').should('be.visible');
      cy.contains('79170302').should('be.visible');
    });
  });

  describe('Multi-Seller Listing Comparison (US-02-2)', () => {
    beforeEach(() => {
      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });
      cy.contains('h1', 'Charizard VMAX').should('be.visible');
    });

    it('renders multi-seller offers sorted ascending by price with seller name and store link', () => {
      // Seller offers header & badge count
      cy.contains('p', 'Compare listings').should('be.visible');
      cy.contains('h2', 'Seller offers').should('be.visible');
      cy.contains('3 offers').should('be.visible');

      // Should have 3 offer articles
      cy.get('section[aria-labelledby="seller-offers-heading"] article').should('have.length', 3);

      // Offer 1 (Lowest price: ฿3,200.00 by Brock Pewter)
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(0).within(() => {
        cy.contains('a', 'Brock Pewter').should('have.attr', 'href', '/stores/usr-3');
        cy.contains('Near Mint · Japanese').should('be.visible');
        cy.contains('฿3,200.00').should('be.visible');
        cy.contains('of 3').should('be.visible');
        cy.get('button').contains('Add to reservation cart').should('not.be.disabled');
        cy.get('button').contains('Reserve now').should('not.be.disabled');
      });

      // Offer 2 (Mid price: ฿3,500.00 by Misty Waterflower)
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(1).within(() => {
        cy.contains('a', 'Misty Waterflower').should('have.attr', 'href', '/stores/usr-2');
        cy.contains('Lightly Played · English').should('be.visible');
        cy.contains('฿3,500.00').should('be.visible');
        cy.contains('of 2').should('be.visible');
      });

      // Offer 3 (Highest price: ฿4,000.00 by Gary Oak - Out of Stock)
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(2).within(() => {
        cy.contains('a', 'Gary Oak').should('have.attr', 'href', '/stores/usr-gary');
        cy.contains('Mint · English').should('be.visible');
        cy.contains('฿4,000.00').should('be.visible');
        cy.contains('Out of stock').should('be.visible');
        cy.contains('of 0').should('be.visible');
      });
    });

    it('disables actions and quantity dropdown for out-of-stock seller offer', () => {
      // Check Offer 3 (Gary Oak - Out of stock)
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(2).within(() => {
        cy.get('[data-testid="quantity-select-offer-chz-03"]').should('be.disabled').and('have.value', '0');
        cy.get('button').contains('Add to reservation cart').should('be.disabled');
        cy.get('button').contains('Reserve now').should('be.disabled');
      });
    });

    it('populates quantity options up to available stock for in-stock offer', () => {
      // Offer 1 has stock 3
      cy.get('[data-testid="quantity-select-offer-chz-01"]').within(() => {
        cy.get('option').should('have.length', 3);
        cy.get('option').eq(0).should('have.value', '1');
        cy.get('option').eq(1).should('have.value', '2');
        cy.get('option').eq(2).should('have.value', '3');
      });

      // Select quantity 2
      cy.get('[data-testid="quantity-select-offer-chz-01"]').select('2').should('have.value', '2');
    });

    it('navigates to public store page when clicking seller name in an offer row', () => {
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(0).within(() => {
        cy.contains('a', 'Brock Pewter').click();
      });

      cy.url().should('include', '/stores/usr-3');
    });
  });

  describe('Cart & Reservation Actions from Card Detail', () => {
    it('prompts unauthenticated guest to log in when clicking Add to Cart or Reserve Now', () => {
      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });

      // 1. Click Add to Cart as Guest
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(0).within(() => {
        cy.contains('button', 'Add to reservation cart').click();
      });

      // ContextualLoginModal opens
      cy.contains('Sign in to collect this card').should('be.visible');
      cy.contains('Log in to collect or reserve cards').should('be.visible');
      cy.contains('button', 'Log in').should('be.visible');
      cy.contains('button', 'Not now').click();
      cy.contains('Sign in to collect this card').should('not.exist');

      // 2. Click Reserve Now as Guest
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(0).within(() => {
        cy.contains('button', 'Reserve now').click();
      });
      cy.contains('Sign in to collect this card').should('be.visible');
      cy.contains('button', 'Not now').click();
      cy.contains('Sign in to collect this card').should('not.exist');
    });

    it('allows authenticated customer to add selected quantity to reservation cart with feedback toast', () => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: customerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: customerUser });

      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'CUSTOMER');
        },
      });

      // Select quantity 2 on Offer 1
      cy.get('[data-testid="quantity-select-offer-chz-01"]').select('2');

      // Click Add to Cart
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(0).within(() => {
        cy.contains('button', 'Add to reservation cart').click();
      });

      // Toast feedback appears
      cy.contains('Added 2 × Charizard VMAX to your reservation cart.').should('be.visible');
    });

    it('allows authenticated customer to use Reserve Now shortcut directly to /cart', () => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: customerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: customerUser });

      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'CUSTOMER');
        },
      });

      // Click Reserve Now on Offer 2
      cy.get('section[aria-labelledby="seller-offers-heading"] article').eq(1).within(() => {
        cy.contains('button', 'Reserve now').click();
      });

      // Navigates directly to cart
      cy.url().should('include', '/cart');
      cy.contains('Reservation Cart').should('be.visible');
    });
  });

  describe('Card Collect Panel', () => {
    it('prompts unauthenticated guest to log in when clicking Collect Card', () => {
      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });

      cy.contains('button', 'Collect Charizard VMAX').click();
      cy.contains('Sign in to collect this card').should('be.visible');
      cy.contains('Log in to collect or reserve cards').should('be.visible');
      cy.contains('button', 'Not now').click();
      cy.contains('Sign in to collect this card').should('not.exist');
    });

    it('adds card to personal collection and opens feedback popup for authenticated customer', () => {
      cy.intercept('GET', '**/auth/me', { statusCode: 200, body: customerUser });
      cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: customerUser });

      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'CUSTOMER');
        },
      });

      // Click Collect Card
      cy.contains('button', 'Collect Charizard VMAX').click();

      // FeedbackPopup appears (CASE 7)
      cy.get('[role="alertdialog"]').should('be.visible').within(() => {
        cy.contains('Added to your collection').should('be.visible');
        cy.contains('Charizard VMAX is now saved to My Collection.').should('be.visible');
        cy.contains('button', 'Keep browsing').click();
      });

      cy.get('[role="alertdialog"]').should('not.exist');
    });
  });

  describe('Similar Cards Recommendation Flow (US-02-3)', () => {
    beforeEach(() => {
      cy.visit('/cards/crd-charizard-vmax', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });
      cy.contains('h1', 'Charizard VMAX').should('be.visible');
    });

    it('renders recommended cards with matching rarity or stage, seller count, and starting price', () => {
      cy.contains('h2', 'Similar cards').should('be.visible');

      // Both Rayquaza VMAX and Umbreon VMAX share 'Secret Rare' & 'VMAX'
      cy.get('section[aria-labelledby="similar-cards-heading"]').within(() => {
        cy.contains('Rayquaza VMAX').should('be.visible');
        cy.contains('From ฿2,500.00').should('be.visible');
        cy.contains('1 seller').should('be.visible');

        cy.contains('Umbreon VMAX').should('be.visible');
        cy.contains('From ฿4,500.00').should('be.visible');
      });
    });

    it('navigates seamlessly to the clicked similar card detail page', () => {
      // Click Rayquaza VMAX in similar cards grid
      cy.get('section[aria-labelledby="similar-cards-heading"]').within(() => {
        cy.contains('a', 'Rayquaza VMAX').click();
      });

      // URL should update to Rayquaza VMAX card detail page
      cy.url().should('include', '/cards/crd-rayquaza-vmax');
      cy.contains('h1', 'Rayquaza VMAX').should('be.visible');
      cy.get('nav[aria-label="Breadcrumb"]').should('contain.text', 'Rayquaza VMAX');

      // Offers on Rayquaza VMAX page should render
      cy.contains('h2', 'Seller offers').should('be.visible');
      cy.contains('1 offer').should('be.visible');
      cy.contains('฿2,500.00').should('be.visible');
    });
  });

  describe('Empty Seller Offers Handling', () => {
    it('displays fallback banner when a card has no active seller offers', () => {
      cy.visit('/cards/crd-mew-promo', {
        onBeforeLoad(win) {
          seedMockStorage(win, 'GUEST');
        },
      });

      cy.contains('h1', 'Mew Ancient Promo').should('be.visible');

      // Seller offers section shows 0 offers and empty notice
      cy.contains('0 offers').should('be.visible');
      cy.contains('No seller has this card listed right now.').should('be.visible');

      // Collect card panel should still be available
      cy.contains('button', 'Collect Mew Ancient Promo').should('be.visible');
    });
  });
});
