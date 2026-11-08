import { auctionField, openAuctionWizard } from '../support/auctionJourney';
import { CARD_PHOTO_BASE64 } from '../support/cardPhotos';

const live = String(Cypress.expose('AUCTION_LIVE_E2E')).toLowerCase() === 'true';
const api = () => String(Cypress.expose('API_BASE_URL')).replace(/\/$/, '');

function login(role: 'BUYER' | 'SELLER') {
  const emailKey = `E2E_${role}_EMAIL`;
  const passwordKey = `E2E_${role}_PASSWORD`;
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
  cy.clearAllCookies();
  cy.env([emailKey, passwordKey], { log: false }).then(credentials => {
    cy.visit('/login');
    cy.get('#email').type(String(credentials[emailKey]), { log: false });
    cy.get('#password').type(String(credentials[passwordKey]), { log: false });
    cy.get('form').contains('button', /^Login$/).click();
    cy.location('pathname').should('not.eq', '/login');
  });
}

(live ? describe : describe.skip)('Auction bidding and settlement against PostgreSQL', () => {
  it('publishes, receives a live bid, buys out, submits proof, ships, and fulfills', () => {
    const card = String(Cypress.expose('E2E_AUCTION_CARD_NAME') || '');
    expect(card, 'dedicated auction fixture').not.to.equal('');
    login('SELLER');
    cy.intercept('POST', '**/api/seller/auctions/*/publish').as('publish');
    openAuctionWizard(card);
    cy.contains('button', /^Next: Pricing$/).click();
    cy.contains('label', 'Enable Buy-It-Now').click();
    auctionField(/Buy-It-Now price/).type('500');
    cy.contains('button', /^Next: Scheduling$/).click();
    cy.contains('button', /^24 hours$/i).click();
    cy.contains('button', /^Review Auction$/).click();
    cy.contains('button', /^Confirm & Create Auction$/).click();
    cy.wait('@publish').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const auctionId = Number(response?.body.id);
      const updates: string[] = [];
      login('BUYER');
      cy.visit('/auctions');
      cy.contains('a', card).click();
      cy.location('pathname').should('eq', `/auctions/${auctionId}`);
      cy.window().then(win => {
        const url = new URL(`${api()}/auctions/${auctionId}/live`);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return new Cypress.Promise<void>((resolve, reject) => {
          const socket = new win.WebSocket(url);
          socket.addEventListener('open', () => resolve(), { once: true });
          socket.addEventListener('error', () => reject(new Error('Auction WebSocket handshake failed')), { once: true });
          socket.addEventListener('message', event => updates.push(String(event.data)));
        });
      });
      cy.contains('button', 'เพิ่มใน Watchlist').click();
      cy.contains('button', 'นำออกจาก Watchlist').should('be.visible');
      cy.contains('button', '+฿50').click();
      cy.contains('button', /^เสนอราคา$/).click();
      cy.get('[role="dialog"]').contains('button', /^ยืนยัน$/).click();
      cy.contains('p', 'บันทึกการเสนอราคาแล้ว').should('be.visible');
      cy.wrap(updates).should('include', 'changed');
      cy.contains('button', /^ซื้อทันที/).click();
      cy.get('[role="dialog"]').contains('button', /^ยืนยัน$/).click();
      cy.contains('a', 'ดูพอร์ตการประมูล').click();
      cy.get('article').filter(':has(input[type="file"])').contains(card).closest('article').within(() => {
        cy.get('input[type="file"]').selectFile({
          contents: Cypress.Buffer.from(CARD_PHOTO_BASE64, 'base64'),
          fileName: 'payment.png',
          mimeType: 'image/png',
        });
        cy.contains('button', 'ส่งหลักฐาน').click();
        cy.contains('a', /^AUC-/).invoke('attr', 'href').as('orderPath');
      });
      cy.contains('[role="status"]', 'ส่งหลักฐานแล้ว').should('be.visible');

      login('SELLER');
      cy.visit('/workspace/orders');
      cy.contains('tr', card).contains('button', 'View payment proof').click();
      cy.get('img[alt="Buyer payment proof"]').should('be.visible');
      cy.contains('tr', card).contains('button', 'Confirm Payment').click();
      cy.get('[role="alertdialog"]').contains('button', 'Confirm payment').click();
      cy.get('[role="alertdialog"]').should('not.exist');
      cy.contains('tr', card).contains('button', 'Mark as Sent').click();
      cy.get('#tracking-number-input').type('TCG-E2E-001');
      cy.get('[role="dialog"]').contains('button', 'Mark as Sent').click();
      cy.contains('tr', card).should('contain.text', 'Sent');

      login('BUYER');
      cy.get<string>('@orderPath').then(path => cy.visit(path));
      cy.contains('button', /^Mark Received$/).click();
      cy.contains('button', 'Yes, Mark Received').click();
      cy.contains(/FULFILLED|Order Completed/i).should('be.visible');
      cy.visit('/collection');
      cy.contains('article', card).should('contain.text', 'Auction won');
    });
  });
});
