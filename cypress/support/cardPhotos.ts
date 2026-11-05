/// <reference types="cypress" />

// A valid, deterministic 1×1 PNG; no remote assets or filesystem binary fixture needed.
export const CARD_PHOTO_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGNUimpiYGBgYgADKAUAEs4BBLIEneoAAAAASUVORK5CYII=';
export const CARD_PHOTO_URL = `data:image/png;base64,${CARD_PHOTO_BASE64}`;

export function uploadCardPhoto(side: 'front' | 'back', name = `${side}.png`) {
  return cy.get(`#seller-listing-${side}-image`).selectFile({
    contents: Cypress.Buffer.from(CARD_PHOTO_BASE64, 'base64'),
    fileName: name,
    mimeType: 'image/png',
    lastModified: 0,
  });
}
