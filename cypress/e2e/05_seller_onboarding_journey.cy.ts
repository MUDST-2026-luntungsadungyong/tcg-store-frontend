/// <reference types="cypress" />

describe('US-05 & US-06: Seller Onboarding & Store Setup Journey', () => {
  const testUser = {
    email: 'new.seller@mythix.com',
    password: 'password123',
    shopName: 'Mythix Card Shop',
    shopDescription: 'Selling the rarest cards in the world.',
    phone: '0812345678',
    line: 'mythix_shop',
    facebook: 'MythixCards'
  };

  it('Phase 1: User applies to become a seller', () => {
    // 1. Mock the user session as a normal USER
    cy.loginByMock('CUSTOMER');
    window.localStorage.setItem('token', 'mock-jwt-token-customer');

    // 2. Intercept the verify API
    cy.intercept('POST', 'http://localhost:8080/api/sellers/verify', {
      statusCode: 200,
      body: { message: 'Success' }
    }).as('submitApplication');

    // 3. Visit the application page
    cy.visit('/profile/seller-application');

    // 4. Fill in the form
    cy.get('#shop-name').clear().type(testUser.shopName);
    cy.get('#shop-description').clear().type(testUser.shopDescription);
    cy.get('#phone').clear().type(testUser.phone);
    cy.get('#line').clear().type(testUser.line);
    cy.get('#facebook').clear().type(testUser.facebook);

    // 5. Submit
    cy.contains('button', 'Submit for review').click();
    cy.wait('@submitApplication');

    // 6. Verify success message
    cy.contains('Application submitted. Your seller account will be activated once an administrator approves it.')
      .should('be.visible');
  });

  it('Phase 2: Admin reviews and approves the application', () => {
    // 1. Mock session as ADMIN
    cy.loginByMock('ADMIN');
    window.localStorage.setItem('token', 'mock-jwt-token-admin');

    // 2. Intercept the seller applications list to include our test user
    const mockApp = {
      id: 'app-999',
      applicantName: 'New Seller',
      applicantEmail: testUser.email,
      shopName: testUser.shopName,
      shopDescription: testUser.shopDescription,
      phone: testUser.phone,
      sellerStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    cy.intercept('GET', 'http://localhost:8080/api/admin/seller-applications', {
      statusCode: 200,
      body: [mockApp]
    }).as('getApplications');

    cy.intercept('PATCH', 'http://localhost:8080/api/admin/seller-applications/app-999/approve', {
      statusCode: 200,
      body: { ...mockApp, sellerStatus: 'APPROVED' }
    }).as('approveApp');

    // 3. Visit Admin Seller Applications page
    cy.visit('/admin/seller-applications');
    cy.wait('@getApplications');

    // 4. Verify the application is on screen
    cy.get('table').contains(testUser.email).should('be.visible');
    cy.get('table').contains(testUser.shopName).should('be.visible');

    // 5. Approve the application
    cy.get('table').contains('button', /Approve/i).click();
    cy.wait('@approveApp');

    // 6. Verify the table is empty (since it was the only pending app)
    cy.get('table').should('not.exist');
  });

  it('Phase 3: User sets up their store as a new Seller', () => {
    // 1. Mock session as SELLER (now they are approved)
    cy.loginByMock('SELLER');
    window.localStorage.setItem('token', 'mock-jwt-token-seller');

    // 2. Intercept profile fetch to load existing data
    cy.intercept('GET', 'http://localhost:8080/api/sellers/me/store', {
      statusCode: 200,
      body: {
        sellerId: 'seller-999',
        shopName: testUser.shopName,
        shopDescription: testUser.shopDescription,
        phone: testUser.phone,
        line: testUser.line,
        facebook: testUser.facebook
      }
    }).as('getStoreProfile');

    cy.intercept('PUT', 'http://localhost:8080/api/sellers/me/store', {
      statusCode: 200,
      body: {
        sellerId: 'seller-999',
        shopName: 'Mythix Card Shop (Official)',
        shopDescription: 'Updated description',
        phone: '0812345678',
        line: 'new_line',
        facebook: 'new_fb'
      }
    }).as('updateStoreProfile');

    // 3. Visit Store Settings
    cy.visit('/workspace/store-settings');
    cy.wait('@getStoreProfile');

    // 4. Verify existing data is populated
    cy.get('#shopName').should('have.value', testUser.shopName);
    cy.get('textarea').should('have.value', testUser.shopDescription);

    // 5. Update data
    cy.get('#shopName').clear().type('Mythix Card Shop (Official)');
    cy.get('textarea').clear().type('Updated description');

    // 6. Save changes
    cy.contains('button', 'Save store profile').click();
    cy.wait('@updateStoreProfile');

    // 7. Verify success message
    cy.contains('Store profile saved.').should('be.visible');
  });

  it('Phase 4: Public Store View', () => {
    // 1. Any user (unauthenticated) can view
    cy.clearLocalStorage();
    cy.clearCookies();

    // 2. Intercept the public store API
    cy.intercept('GET', 'http://localhost:8080/api/stores/seller-999', {
      statusCode: 200,
      body: {
        sellerId: 'seller-999',
        shopName: 'Mythix Card Shop (Official)',
        shopDescription: 'Updated description',
        avatarUrl: null
      }
    }).as('getPublicStore');

    // Intercept listings for this store
    cy.intercept('GET', 'http://localhost:8080/api/products*', {
      statusCode: 200,
      body: {
        items: [],
        pageNumber: 0,
        pageSize: 100,
        totalElements: 0,
        totalPages: 1
      }
    }).as('getStoreListings');

    // 3. Visit Public Store page
    cy.visit('/stores/seller-999');
    cy.wait('@getPublicStore');

    // 4. Verify Store Info is displayed
    cy.contains('Mythix Card Shop (Official)').should('be.visible');
    cy.contains('Updated description').should('be.visible');
  });
});
