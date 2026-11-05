/// <reference types="cypress" />
import { CARD_PHOTO_BASE64, CARD_PHOTO_URL, uploadCardPhoto } from '../support/cardPhotos';

const common = {
  id: 'us20-common', cardId: 'us20-common', sellerId: '2', name: 'US20 Common Pikachu',
  game: 'Pokemon', rarity: 'Common', set: 'US20 fixtures', cardNumber: '1',
  image: CARD_PHOTO_URL, imageLarge: CARD_PHOTO_URL, price: 100, marketPrice: 100,
  cost: 50, stock: 2, status: 'SHOW', condition: 'NM', language: 'EN',
};

function openNewListing(name = common.name) {
  cy.contains('button', 'Add Listing').click();
  cy.get('#seller-listing-card-search').type(name);
  cy.get('[role="listbox"] [role="option"]').first().click();
  cy.get('#seller-listing-stock').clear().type('1');
}
function saveListing() {
  cy.get('[role="dialog"]').contains('button', 'Add Listing').click();
}
function expectPublishBlocked() {
  cy.get('[role="dialog"]').contains('button', 'Add Listing').should('be.disabled');
}
function expectSaved() {
  cy.contains('Listing added').should('be.visible');
  cy.get('[role="dialog"]').should('not.exist');
}

describe('US-20 actual card photo policy', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.loginByMock('SELLER');
    cy.window().then((win) => {
      win.localStorage.setItem('mythix_mock_listings_v2', JSON.stringify([
        common,
        { ...common, id: 'us20-special', cardId: 'us20-special', name: 'US20 Special Card', rarity: 'Special Illustration Rare' },
        { ...common, id: 'us20-unknown', cardId: 'us20-unknown', name: 'US20 Unknown Card', rarity: undefined },
      ]));
      win.localStorage.setItem('mythix_mock_reservations_v1', '[]');
    });
    cy.visit('/workspace/listings');
    cy.contains('h1', 'Listing Management').should('be.visible');
  });

  it('allows a common NM card below 500 with catalog art only', () => {
    openNewListing();
    cy.get('#seller-listing-price').clear().type('499');
    saveListing();
    expectSaved();
    cy.reload();
    cy.contains('h1', 'Listing Management').should('be.visible');
    cy.contains('499').should('be.visible');
  });

  it('requires both sides at exactly 500 and persists actual photos after reload', () => {
    openNewListing();
    cy.get('#seller-listing-price').clear().type('500');
    expectPublishBlocked();
    cy.get('[role="dialog"]').should('be.visible');
    uploadCardPhoto('front');
    expectPublishBlocked();
    cy.get('[role="dialog"]').should('be.visible');
    uploadCardPhoto('back');
    cy.get('[role="dialog"]').contains('button', 'Remove front photo').click();
    expectPublishBlocked();
    uploadCardPhoto('front', 'replacement-front.png');
    saveListing();
    expectSaved();
    cy.reload();
    cy.window().then((win) => {
      const listings = JSON.parse(win.localStorage.getItem('mythix_mock_listings_v2') || '[]');
      const created = listings.find((item: typeof common) => item.name === common.name && item.price === 500);
      expect(created.actualImageFrontUrl).to.match(/^data:image\/png;base64,/);
      expect(created.actualImageBackUrl).to.match(/^data:image\/png;base64,/);
    });
  });

  it('requires actual photos for a played card even below 500', () => {
    openNewListing();
    cy.get('#seller-listing-condition').select('LP');
    expectPublishBlocked();
    cy.get('[role="dialog"]').should('be.visible');
    uploadCardPhoto('front'); uploadCardPhoto('back');
    saveListing(); expectSaved();
  });

  it('requires actual photos for a graded card and retains seller grading data', () => {
    openNewListing();
    cy.get('#seller-listing-grading-company').select('PSA');
    cy.get('#seller-listing-grade').type('10');
    cy.get('#seller-listing-cert-number').type('US20-CERT-123');
    expectPublishBlocked();
    cy.get('[role="dialog"]').should('be.visible');
    uploadCardPhoto('front'); uploadCardPhoto('back');
    saveListing(); expectSaved();
    cy.window().then((win) => {
      const listings = JSON.parse(win.localStorage.getItem('mythix_mock_listings_v2') || '[]');
      expect(listings.find((item: {certNumber?: string}) => item.certNumber === 'US20-CERT-123'))
        .to.include({ gradingCompany: 'PSA', grade: '10' });
    });
  });

  for (const name of ['US20 Special Card', 'US20 Unknown Card']) {
    it(`requires actual photos for ${name} below 500`, () => {
      openNewListing(name);
      expectPublishBlocked();
      cy.get('[role="dialog"]').should('be.visible');
      uploadCardPhoto('front'); uploadCardPhoto('back');
      saveListing(); expectSaved();
    });
  }

  it('rejects unsupported and oversized photos without submitting the listing', () => {
    openNewListing();
    cy.get('#seller-listing-front-image').selectFile({ contents: Cypress.Buffer.from('not an image'), fileName: 'card.txt', mimeType: 'text/plain' });
    cy.contains(/JPG|PNG|WebP/).should('be.visible');
    cy.get('#seller-listing-back-image').selectFile({ contents: Cypress.Buffer.alloc(5 * 1024 * 1024 + 1), fileName: 'large.png', mimeType: 'image/png' });
    cy.contains(/5\s*(MB|MiB)/).should('be.visible');
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('limits additional photos to four and persists removal without dropping the required sides', () => {
    openNewListing();
    uploadCardPhoto('front'); uploadCardPhoto('back');
    const files = Array.from({ length: 4 }, (_, index) => ({
      contents: Cypress.Buffer.from(CARD_PHOTO_BASE64, 'base64'),
      fileName: `detail-${index + 1}.png`, mimeType: 'image/png',
    }));
    cy.get('#seller-listing-additional-images').selectFile(files);
    cy.get('[aria-label^="Remove new additional photo"]').should('have.length', 4);
    cy.get('#seller-listing-additional-images').selectFile(files[0]);
    cy.contains('Add up to 4 additional photos.').should('be.visible');
    cy.get('[aria-label^="Remove new additional photo"]').should('have.length', 4);
    cy.get('[aria-label="Remove new additional photo 2"]').click();
    saveListing(); expectSaved();
    cy.window().then((win) => {
      const listings = JSON.parse(win.localStorage.getItem('mythix_mock_listings_v2') || '[]');
      const created = listings.find((item: typeof common & {additionalImageUrls?: string[]}) => item.additionalImageUrls?.length === 3);
      expect(created.actualImageFrontUrl).to.be.a('string').and.not.be.empty;
      expect(created.actualImageBackUrl).to.be.a('string').and.not.be.empty;
    });
  });

  it('saves an incomplete hidden listing but blocks publishing until both sides exist', () => {
    openNewListing();
    cy.get('#seller-listing-price').clear().type('700');
    cy.get('#seller-listing-status').select('HIDE');
    saveListing(); expectSaved();
    cy.window().then((win) => {
      const listings = JSON.parse(win.localStorage.getItem('mythix_mock_listings_v2') || '[]');
      const draft = listings.find((item: typeof common) => item.name === common.name && item.price === 700);
      expect(draft.status).to.eq('HIDE');
    });
    cy.get('table tbody tr').contains('700').closest('tr').as('draftRow');
    cy.get('@draftRow').find('button[role="switch"]').click();
    cy.get('@draftRow').find('button[role="switch"]').should('have.attr', 'aria-checked', 'false');
    cy.get('@draftRow').contains('button', 'Edit').click();
    uploadCardPhoto('front'); uploadCardPhoto('back');
    cy.get('#seller-listing-status').select('SHOW');
    cy.get('[role="dialog"]').contains('button', 'Save Changes').click();
    cy.get('[role="dialog"]').should('not.exist');
    cy.reload();
    cy.get('table tbody tr').contains('700').closest('tr').find('button[role="switch"]').should('have.attr', 'aria-checked', 'true');
  });
});
