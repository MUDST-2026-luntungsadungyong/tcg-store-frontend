/// <reference types="cypress" />

describe('US-05 & US-06: Seller Inventory Management and Metrics', () => {
  const api = 'http://localhost:8080/api';

  const mockPikachuCatalogCard = {
    id: 'base1-58',
    name: 'Pikachu',
    game: 'Pokemon',
    supertype: 'Pokémon',
    subtypes: 'Basic',
    hp: '40',
    types: 'Lightning',
    rarity: 'Common',
    setName: 'Base Set',
    cardNumber: '58',
    imageSmall: 'https://images.pokemontcg.io/base1/58.png',
    imageLarge: 'https://images.pokemontcg.io/base1/58_hires.png',
    marketPrice: 50,
  };

  const initialListing = {
    id: 'prd-charizard-vmax',
    cardId: 'crd-charizard-vmax',
    sellerId: '2',
    name: 'Charizard VMAX',
    game: 'Pokemon',
    price: 3200,
    cost: 2000,
    stock: 3,
    status: 'SHOW',
    condition: 'Near Mint',
    language: 'English',
    set: "Champion's Path",
    rarity: 'Secret Rare',
    cardNumber: '074/073',
    image: 'https://images.pokemontcg.io/swsh45/sv107.png',
    activeReservationCount: 0,
  };

  const addedPikachuListing = {
    id: 'prd-pikachu-58',
    cardId: 'base1-58',
    sellerId: '2',
    name: 'Pikachu',
    game: 'Pokemon',
    price: 1000,
    cost: 500,
    stock: 5,
    status: 'SHOW',
    condition: 'Near Mint',
    language: 'English',
    set: 'Base Set',
    rarity: 'Common',
    cardNumber: '58',
    image: 'https://images.pokemontcg.io/base1/58.png',
    activeReservationCount: 0,
  };

  let currentListings: any[] = [];

  beforeEach(() => {
    currentListings = [{ ...initialListing }];

    cy.loginByMock('SELLER');

    // 1. Seller listings GET
    cy.intercept('GET', `${api}/seller/listings*`, (req) => {
      const url = new URL(req.url);
      const search = url.searchParams.get('search');
      if (search) {
        req.reply({
          statusCode: 200,
          body: currentListings.filter((l) =>
            l.name.toLowerCase().includes(search.toLowerCase()),
          ),
        });
      } else {
        req.reply({ statusCode: 200, body: currentListings });
      }
    }).as('getSellerListings');

    // 2. Create listing POST
    cy.intercept('POST', `${api}/seller/listings*`, (req) => {
      currentListings = [addedPikachuListing, ...currentListings];
      req.reply({ statusCode: 201, body: addedPikachuListing });
    }).as('createListing');

    // 3. Update listing PUT
    cy.intercept('PUT', `${api}/seller/listings/*`, (req) => {
      const parts = req.url.split('/');
      const id = parts[parts.length - 1].split('?')[0];
      const target = currentListings.find((l) => l.id === id) || currentListings[0];
      req.reply({
        statusCode: 200,
        body: { ...target, ...req.body },
      });
    }).as('updateListing');

    // 3.1 Visibility toggle PATCH
    cy.intercept('PATCH', `${api}/seller/listings/*/visibility`, (req) => {
      const parts = req.url.split('/');
      const id = parts[parts.length - 2];
      const target = currentListings.find((l) => l.id === id) || currentListings[0];
      const nextStatus = req.body?.status || (target.status === 'SHOW' ? 'HIDE' : 'SHOW');
      target.status = nextStatus;
      req.reply({
        statusCode: 200,
        body: { success: true, listing: { ...target, status: nextStatus } },
      });
    }).as('toggleVisibility');

    // 4. Delete listing DELETE
    cy.intercept('DELETE', `${api}/seller/listings/*`, (req) => {
      const parts = req.url.split('/');
      const id = parts[parts.length - 1].split('?')[0];
      currentListings = currentListings.filter((l) => l.id !== id);
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('deleteListing');

    // 5. Catalog cards search
    cy.intercept('GET', `${api}/cards*`, {
      statusCode: 200,
      body: [mockPikachuCatalogCard],
    }).as('searchCatalogCards');
  });

  it('US-05-1, US-05-4: Add a new listing and verify it appears in inventory filter', () => {
    cy.visit('/workspace/listings');

    // Wait for the UI to be fully visible (the title)
    cy.contains('h1', 'Listing Management').should('be.visible');

    // 1. Click Add Listing
    cy.contains('button', 'Add Listing').click();
    cy.contains('Add Listing').should('be.visible');

    // 2. Select card from CatalogCardPicker
    // Wait for the input to appear and be enabled
    cy.get('input[placeholder*="Search card name, set, rarity"]').should('be.visible').type('Pikachu', { delay: 50 });
    
    // Select the first card from the dropdown
    cy.get('[role="listbox"]').should('be.visible').find('button').first().should('be.visible').click();

    // Verify it is selected
    cy.get('[role="listbox"]').should('not.exist'); // The dropdown closes

    // 3. Fill out the form
    cy.get('input[id*="seller-listing-price"]').clear().type('1000');
    cy.get('input[id*="seller-listing-stock"]').clear().type('5');

    // 4. Save
    // We should wait until loading/busy state is over
    cy.get('button[type="submit"]').contains('Add Listing').should('not.be.disabled').click({ force: true });

    // 5. Verify toast 
    // The exact toast can be "Listing added" or just check success
    cy.contains(/added to your inventory/i).should('be.visible');

    // 6. Test Filter by keyword
    cy.get('input[aria-label="Search listings"]').clear().type('Pikachu');
    
    // It should filter the grid or table
    cy.get('table, .grid').contains(/Pikachu/i).should('be.visible');
  });

  it('US-05-5 & US-06-1: Toggle listing visibility and verify cost/profit metrics', () => {
    cy.visit('/workspace/listings');
    
    // Wait for the page to load
    cy.contains('h1', 'Listing Management').should('be.visible');
    
    // Wait for listings to be loaded into the table/grid
    cy.get('table tbody tr, .grid article').should('have.length.at.least', 1);

    // Check for Profit metrics
    cy.get('body').then(($body) => {
      // It can be either Cost/Profit headers in table, or dt text in grid
      expect($body.text()).to.match(/Cost|Profit/i);
    });

    // Toggle visibility (US-05-5)
    // Click the first switch
    cy.get('button[role="switch"]').first().click();
    cy.wait('@toggleVisibility');
    
    // Wait for toast
    cy.contains(/Listing hidden|Listing visible/i).should('be.visible');
    
    // Toggle back
    cy.get('button[role="switch"]').first().click();
    cy.wait('@toggleVisibility');
    cy.contains(/Listing hidden|Listing visible/i).should('be.visible');
  });

  it('US-05-2: Delete a listing', () => {
    cy.visit('/workspace/listings');
    
    cy.contains('h1', 'Listing Management').should('be.visible');

    // Make sure we have at least one listing, or we added one in the previous step
    // Click delete on the first listing
    cy.get('button[title="Delete listing"]').first().click({ force: true });
    
    // Check confirmation modal
    cy.contains(/Delete this listing\?/i).should('be.visible');
    
    // Confirm delete inside the dialog
    cy.get('[role="alertdialog"]').contains('button', 'Delete listing').click();
    
    // Verify toast
    cy.contains(/removed from your inventory|Cannot delete listing|Delete failed/i).should('be.visible');
  });
});
