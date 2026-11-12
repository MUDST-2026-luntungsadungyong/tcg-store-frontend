/// <reference types="cypress" />
import {
  LISTING_PIKACHU_2000,
  USER_VOUCHER_STORAGE_KEY,
  VOUCHER_BROADCAST_CHANNEL,
  VOUCHER_CATALOG_STORAGE_KEY,
  VOUCHER_DOM_EVENT,
  defaultMockVouchers,
  offsetIsoFromNow,
  toLocalDateTimeInput,
  visitWithMockVoucherState,
  voucherCardByCode,
} from '../support/vouchers';

describe('Cross-Role Voucher Sync: Admin Changes <-> Buyer Flows (Mock DB)', () => {
  it('propagates Admin voucher creation, pause, and deletion to Buyer Voucher Center and My Vouchers wallet', () => {
    // 1. Admin creates promo LIVE120
    visitWithMockVoucherState('/admin/vouchers', { role: 'ADMIN' });
    cy.contains('button', 'Create voucher').first().click();

    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 3_600_000);
    cy.get('[role="dialog"]:visible').within(() => {
      cy.get('#voucher-code').clear().type('LIVE120');
      cy.get('#voucher-discount-type').select('FIXED_AMOUNT');
      cy.get('#voucher-title').clear().type('แคมเปญซิงค์ ฿120');
      cy.get('#voucher-description').clear().type('ลดทันที 120 บาท เมื่อซื้อครบ 500 บาท');
      cy.get('#voucher-discount-value').clear().type('120');
      cy.get('#voucher-min-spend').clear().type('500');
      cy.get('#voucher-total-quota').clear().type('25');
      cy.get('#voucher-start-time').clear().type(toLocalDateTimeInput(now));
      cy.get('#voucher-end-time').clear().type(toLocalDateTimeInput(in14Days));
      cy.contains('button', 'Create voucher').click();
    });
    cy.contains('Voucher LIVE120 created and published.').should('be.visible');

    // 2. Buyer opens /vouchers -> sees LIVE120 and claims it
    visitWithMockVoucherState('/vouchers', {
      role: 'CUSTOMER',
      preserveExistingVouchers: true,
    });
    cy.contains('code', 'LIVE120').should('be.visible');
    voucherCardByCode('LIVE120').within(() => {
      cy.contains('แคมเปญซิงค์ ฿120').should('be.visible');
      cy.contains('button', 'เก็บโค้ด').click();
      cy.contains('button', 'เก็บแล้ว').should('be.disabled');
    });

    // 3. Admin pauses LIVE120 and updates WELCOME10 title
    visitWithMockVoucherState('/admin/vouchers', {
      role: 'ADMIN',
      preserveExistingVouchers: true,
    });
    cy.get('table').contains('tr', 'LIVE120').find('button[aria-label="Disable LIVE120"]').click();
    cy.contains('LIVE120 is now paused.').should('be.visible');

    cy.get('table').contains('tr', 'WELCOME10').find('button[aria-label="Edit WELCOME10"]').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.get('#voucher-title').clear().type('ซิงค์ชื่อใหม่ 10%');
      cy.contains('button', 'Save changes').click();
    });
    cy.contains('Voucher WELCOME10 updated and synced.').should('be.visible');

    // 4. Buyer sees paused LIVE120 hidden from /vouchers and flagged in /profile/vouchers
    visitWithMockVoucherState('/vouchers', {
      role: 'CUSTOMER',
      preserveExistingVouchers: true,
    });
    cy.contains('ซิงค์ชื่อใหม่ 10%').should('be.visible');
    cy.contains('code', 'LIVE120').should('not.exist');

    cy.visit('/profile/vouchers');
    cy.contains('LIVE120').should('be.visible');
    cy.contains('ถูกปิดใช้งานโดยผู้ดูแลระบบ').should('be.visible');
    cy.contains('a', 'ใช้ในการสั่งซื้อ').should('not.exist');
  });

  it('auto-revalidates and clears an applied voucher on /checkout when Admin disables it in real time', () => {
    const vouchers = defaultMockVouchers();
    const claimedWallet = [
      {
        id: 201,
        voucherId: 1,
        code: 'WELCOME10',
        title: 'ส่วนลด 10% สมาชิกใหม่',
        description: 'ลด 10% สูงสุด 100 บาท เมื่อซื้อขั้นต่ำ 300 บาท',
        discountType: 'PERCENTAGE' as const,
        discountValue: 10,
        minSpend: 300,
        maxDiscountAmount: 100,
        status: 'CLAIMED' as const,
        claimedAt: new Date().toISOString(),
        usedAt: null,
        endTime: offsetIsoFromNow(90),
        startTime: offsetIsoFromNow(-1),
        isActive: true,
      },
    ];

    visitWithMockVoucherState('/checkout', {
      role: 'CUSTOMER',
      vouchers,
      userVouchers: claimedWallet,
      listings: [LISTING_PIKACHU_2000],
      cartItems: [{ listing: LISTING_PIKACHU_2000, quantity: 1 }],
    });

    // Apply WELCOME10 on Checkout (฿2,000 - ฿100 = ฿1,900)
    cy.contains('button', 'เลือกหรือใส่โค้ดส่วนลด').click();
    cy.contains('h3', 'โค้ดส่วนลดที่ใช้ได้ (1)').parent().within(() => {
      voucherCardByCode('WELCOME10').within(() => {
        cy.contains('button', 'ใช้โค้ด').click();
      });
    });
    cy.contains('button', 'ตกลง').click();
    cy.contains('Confirm reservation (฿1,900.00)').should('be.visible');

    // Simulate Admin disabling WELCOME10 in another tab & firing live update event
    cy.window().then((win) => {
      const updatedCatalog = JSON.parse(win.localStorage.getItem(VOUCHER_CATALOG_STORAGE_KEY) || '[]')
        .map((v: { code: string; isActive: boolean }) => (v.code === 'WELCOME10' ? { ...v, isActive: false } : v));
      win.localStorage.setItem(VOUCHER_CATALOG_STORAGE_KEY, JSON.stringify(updatedCatalog));

      const updatedWallet = JSON.parse(win.localStorage.getItem(USER_VOUCHER_STORAGE_KEY) || '[]')
        .map((uv: { code: string; isActive: boolean }) => (uv.code === 'WELCOME10' ? { ...uv, isActive: false } : uv));
      win.localStorage.setItem(USER_VOUCHER_STORAGE_KEY, JSON.stringify(updatedWallet));

      win.dispatchEvent(new CustomEvent(VOUCHER_DOM_EVENT, { detail: { type: 'TOGGLED', voucherId: 1 } }));
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel(VOUCHER_BROADCAST_CHANNEL);
        ch.postMessage({ type: 'TOGGLED', voucherId: 1 });
        ch.close();
      }
    });

    // CheckoutPage.revalidateSelectedVoucher detects unavailable voucher, clears discount, and shows alert
    cy.get('[role="alert"]').should('contain.text', 'WELCOME10');
    cy.contains('ส่วนลดจากโค้ด').should('not.exist');
    cy.contains('Confirm reservation (฿2,000.00)').should('be.visible');
  });

  it('keeps existing order discount snapshot intact after Admin deletes the redeemed voucher', () => {
    const existingOrder = {
      id: 'ord-snapshot-1',
      buyerId: 'usr-1',
      sellerId: 'usr-3',
      items: [{ listing: LISTING_PIKACHU_2000, quantity: 1 }],
      subtotalAmount: 2000,
      discountAmount: 100,
      voucherCode: 'WELCOME10',
      totalAmount: 1900,
      status: 'RESERVED',
      createdAt: new Date().toISOString(),
    };

    visitWithMockVoucherState('/admin/vouchers', {
      role: 'ADMIN',
      reservations: [existingOrder],
    });

    cy.get('table').contains('tr', 'WELCOME10').find('button[aria-label="Delete WELCOME10"]').click();
    cy.get('[role="dialog"]:visible').contains('button', 'Delete permanently').click();
    cy.contains('Voucher WELCOME10 deleted.').should('be.visible');

    visitWithMockVoucherState('/orders/ord-snapshot-1', {
      role: 'CUSTOMER',
      preserveExistingVouchers: true,
      preserveExistingReservations: true,
    });

    cy.contains('Voucher Discount (WELCOME10)').should('be.visible');
    cy.contains('-฿100').should('be.visible');
    cy.contains('฿1,900').should('be.visible');
  });
});
