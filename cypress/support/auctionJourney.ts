import { CARD_PHOTO_BASE64 } from './cardPhotos';

export function selectAuctionPhoto(label: string, name: string) {
  cy.get(`input[type="file"][aria-label="${label}"]`).selectFile({
    contents: Cypress.Buffer.from(CARD_PHOTO_BASE64, 'base64'),
    fileName: name,
    mimeType: 'image/png',
    lastModified: 0,
  });
}

export function auctionField(label: RegExp) {
  return cy.contains('label', label).invoke('attr', 'for')
    .then(id => cy.get(`input[id="${id}"]`));
}

export function openAuctionWizard(cardName: string) {
  cy.visit('/workspace/auctions');
  cy.contains('a, button', /^Create Auction$/).click();
  cy.contains('button', /^My Collection$/).click();
  cy.contains('button', cardName).click();
  auctionField(/Start price/).clear().type('100');
  selectAuctionPhoto('Front photo', 'front.png');
  selectAuctionPhoto('Back photo', 'back.png');
}

export function reviewImmediateAuction() {
  cy.contains('button', /^Next: Pricing$/).click();
  cy.contains('button', /^Next: Scheduling$/).click();
  cy.contains('button', /^24 hours$/i).click();
  cy.contains('button', /^Review Auction$/).click();
}
