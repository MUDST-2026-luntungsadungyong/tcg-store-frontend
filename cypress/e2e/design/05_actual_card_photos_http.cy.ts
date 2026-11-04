/// <reference types="cypress" />
import { CARD_PHOTO_URL, uploadCardPhoto } from '../../support/cardPhotos';

// Runs in API mode (port3001 in CI). Intercepts HTTP, not the in-browser mock
// API, so multipart serialization and server-error rendering are exercised.
describe('US-20 HTTP upload and per-offer gallery contract', () => {
  const card = { id: 'photo-http-card', name: 'HTTP Photo Card', game: 'Pokemon', rarity: 'Common', setName: 'Photo set', imageLarge: CARD_PHOTO_URL, imageSmall: CARD_PHOTO_URL, marketPrice: 100 };
  const baseOffer = { id: 'photo-offer-1', cardId: card.id, sellerId: '2', sellerName: 'First seller', name: card.name, game: 'Pokemon', rarity: 'Common', set: 'Photo set', condition: 'NM', language: 'EN', image: CARD_PHOTO_URL, imageLarge: CARD_PHOTO_URL, price: 500, cost: 50, stock: 1, status: 'SHOW', additionalImageUrls: [] };
  let offers: Array<Record<string, unknown>>;
  beforeEach(() => {
    offers = [{ ...baseOffer }];
    cy.loginByMock('SELLER');
    cy.intercept('GET', '**/api/cards?*', [card]);
    cy.intercept('GET', `**/api/cards/${card.id}`, card);
    cy.intercept('GET', '**/api/seller/listings*', (req) => req.reply({ statusCode: 200, body: offers }));
    cy.intercept('POST', '**/api/seller/*/validate-listing-rules', {
      imageMandatory: true, reasons: ['HIGH_PRICE'], minimumActualPhotos: 2,
      maxAdditionalImages: 4, maxImageSizeBytes: 5 * 1024 * 1024,
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  });

  it('submits real front/back file parts and persists the response on reload', () => {
    cy.intercept('POST', '**/api/seller/listings', (req) => {
      expect(req.headers['content-type']).to.include('multipart/form-data; boundary=');
      // Cypress can expose multipart body as a binary string or ArrayBuffer.
      const body = typeof req.body === 'string' ? req.body : Cypress.Buffer.from(req.body).toString('utf8');
      expect(body).to.include('name="frontImage"');
      expect(body).to.include('filename="front.png"');
      expect(body).to.include('name="backImage"');
      expect(body).to.include('filename="back.png"');
      expect(body).to.include('name="cardId"');
      offers = [{ ...baseOffer, id: 'photo-created-offer', actualImageFrontUrl: '/photo-front.png', actualImageBackUrl: '/photo-back.png' }];
      req.reply({ statusCode: 201, body: offers[0] });
    }).as('upload');
    cy.visit('/workspace/listings');
    cy.contains('button', 'Add Listing').click();
    cy.get('#seller-listing-card-search').type(card.name);
    cy.get('[role="listbox"] [role="option"]').first().click();
    cy.get('#seller-listing-price').clear().type('500');
    cy.get('#seller-listing-stock').clear().type('1');
    uploadCardPhoto('front'); uploadCardPhoto('back');
    cy.get('[role="dialog"]').contains('button', 'Add Listing').click();
    cy.wait('@upload').its('response.statusCode').should('eq', 201);
    cy.get('[role="dialog"]').should('not.exist');
    cy.reload();
    cy.contains('button', 'Edit').first().click();
    cy.get('[role="dialog"] img[alt="front photo preview"]').should('have.attr', 'src', '/photo-front.png');
    cy.get('[role="dialog"] img[alt="back photo preview"]').should('have.attr', 'src', '/photo-back.png');
  });

  it('shows server validation failures without reporting a successful save', () => {
    cy.intercept('POST', '**/api/seller/listings', {
      statusCode: 400,
      body: { code: 'VALIDATION_ERROR', message: 'Actual front and back photos are required', fieldErrors: { actualImageFrontUrl: 'Actual front and back photos are required' } },
    }).as('rejectedUpload');
    cy.visit('/workspace/listings');
    cy.contains('button', 'Add Listing').click();
    cy.get('#seller-listing-card-search').type(card.name);
    cy.get('[role="listbox"] [role="option"]').first().click();
    cy.get('#seller-listing-price').clear().type('500');
    uploadCardPhoto('front'); uploadCardPhoto('back');
    cy.get('[role="dialog"]').contains('button', 'Add Listing').click();
    cy.wait('@rejectedUpload');
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Actual front and back photos are required').should('be.visible');
    cy.contains('Listing added').should('not.exist');
  });

  for (const width of [1280, 390]) {
    it(`keeps actual photos tied to the selected seller and supports 2.5x zoom at ${width}px`, () => {
      cy.viewport(width, 900);
      offers = [
        { ...baseOffer, actualImageFrontUrl: '/us20/front-1.png', actualImageBackUrl: '/us20/back-1.png', gradingCompany: 'PSA', grade: '10', certNumber: 'SELLER-ONE' },
        { ...baseOffer, id: 'photo-offer-2', sellerId: '3', sellerName: 'Second seller', price: 600, actualImageFrontUrl: '/us20/front-2.png', actualImageBackUrl: '/us20/back-2.png' },
        { ...baseOffer, id: 'photo-offer-legacy', sellerId: '4', sellerName: 'Legacy seller', price: 700 },
      ];
      cy.intercept('GET', '**/api/products*', (req) => req.reply({ items: offers, pageNumber: 0, pageSize: 100, totalElements: 3, totalPages: 1, last: true }));
      cy.intercept('GET', '**/us20/*.png', { statusCode: 200, headers: { 'content-type': 'image/png' }, fixture: 'us20-card-photo.png' });
      cy.visit(`/cards/${card.id}`);
      cy.get('[aria-label="Card image gallery"]').as('gallery');
      cy.get('@gallery').find('[role="tab"]').contains('Official Art').should('have.attr', 'aria-selected', 'true');
      cy.get('@gallery').find('[role="tab"]').contains('Actual Card Photos').click();
      cy.get('#card-photo-seller').should('have.value', baseOffer.id);
      cy.get('@gallery').find('img[alt="Front actual card photo"]').should('have.attr', 'src', '/us20/front-1.png');
      cy.get('@gallery').contains('Seller supplied, unverified').should('be.visible');
      cy.get('@gallery').contains('button', 'Zoom 2.5×').click().should('have.attr', 'aria-pressed', 'true');
      cy.get('@gallery').find('img[alt="Front actual card photo"]').should('have.css', 'transform', 'matrix(2.5, 0, 0, 2.5, 0, 0)');
      cy.get('@gallery').contains('button', /^Back$/).click();
      cy.get('@gallery').find('img[alt="Back actual card photo"]').should('have.attr', 'src', '/us20/back-1.png');
      cy.get('#card-photo-seller').select('photo-offer-2');
      cy.get('@gallery').find('img[alt="Front actual card photo"]').should('have.attr', 'src', '/us20/front-2.png');
      cy.get('@gallery').contains('SELLER-ONE').should('not.exist');
      cy.get('#card-photo-seller').select('photo-offer-legacy');
      cy.get('@gallery').contains('This seller has not uploaded actual card photos.').should('be.visible');
      cy.document().should((document) => expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth + 1));
    });
  }
});
