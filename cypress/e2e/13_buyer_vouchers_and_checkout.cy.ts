/// <reference types="cypress" />
import {
  LISTING_CHARIZARD_600,
  LISTING_PIKACHU_2000,
  USER_VOUCHER_STORAGE_KEY,
  VOUCHER_CATALOG_STORAGE_KEY,
  defaultMockVouchers,
  offsetIsoFromNow,
  visitWithMockVoucherState,
  voucherCardByCode,
} from '../support/vouchers';

describe('Buyer Discount & Voucher Journey (Mock DB)', () => {
  it('allows guests to browse vouchers, blocks claiming until login, and protects /profile/vouchers', () => {
    visitWithMockVoucherState('/vouchers', { role: null });

    cy.contains('h1', 'แจกโค้ดส่วนลดสุดคุ้ม').should('be.visible');
    cy.contains('code', 'WELCOME10').should('be.visible');

    voucherCardByCode('WELCOME10').within(() => {
      cy.contains('button', 'เก็บโค้ด').click();
    });

    cy.contains('กรุณาเข้าสู่ระบบก่อนทำการเก็บโค้ดส่วนลด').should('be.visible');

    cy.visit('/profile/vouchers');
    cy.location('pathname').should('eq', '/login');
  });

  it('filters vouchers by type, claims into wallet, persists on reload, and shows sold-out state', () => {
    const vouchers = [
      ...defaultMockVouchers(),
      {
        id: 5,
        code: 'SOLDOUT50',
        title: 'คูปองสิทธิ์เต็ม',
        description: 'โควตาถูกเก็บไปหมดแล้ว',
        discountType: 'FIXED_AMOUNT' as const,
        discountValue: 50,
        minSpend: 300,
        maxDiscountAmount: null,
        totalQuota: 50,
        usedQuota: 50,
        remainingQuota: 0,
        quotaPercentage: 100,
        startTime: offsetIsoFromNow(-1),
        endTime: offsetIsoFromNow(15),
        isActive: true,
      },
    ];

    visitWithMockVoucherState('/vouchers', { role: 'CUSTOMER', vouchers });

    // Category filter tabs
    cy.contains('button', /โค้ดส่วนลดทั้งหมด/).should('contain.text', '(5)');
    cy.contains('button', 'ส่วนลดเปอร์เซ็นต์ (%)').click();
    cy.contains('code', 'WELCOME10').should('be.visible');
    cy.contains('code', 'POKEMON15').should('be.visible');
    cy.contains('code', 'MYTHIX50').should('not.exist');

    cy.contains('button', 'ส่วนลดเงินสด (฿)').click();
    cy.contains('code', 'MYTHIX50').should('be.visible');
    cy.contains('code', 'FLASH100').should('be.visible');
    cy.contains('code', 'WELCOME10').should('not.exist');

    cy.contains('button', /โค้ดส่วนลดทั้งหมด/).click();

    // Sold-out voucher cannot be claimed
    voucherCardByCode('SOLDOUT50').within(() => {
      cy.contains('สิทธิ์เต็มแล้ว').should('be.visible');
      cy.contains('button', 'หมดแล้ว').should('be.disabled');
    });

    // Claim WELCOME10
    voucherCardByCode('WELCOME10').within(() => {
      cy.contains('button', 'เก็บโค้ด').click();
      cy.contains('button', 'เก็บแล้ว').should('be.disabled');
    });

    cy.contains('เก็บโค้ดส่วนลดสำเร็จ! โค้ดถูกเพิ่มในกระเป๋าของคุณแล้ว').should('be.visible');

    // Reload preserves claimed state
    cy.reload();
    voucherCardByCode('WELCOME10').within(() => {
      cy.contains('button', 'เก็บแล้ว').should('be.disabled');
    });

    // Navigate to My Vouchers wallet
    cy.contains('a', 'ดูโค้ดส่วนลดของฉัน').click();
    cy.location('pathname').should('eq', '/profile/vouchers');

    cy.contains('button', 'พร้อมใช้งาน (1)').should('be.visible');
    cy.contains('code', 'WELCOME10').should('not.exist'); // rendered as span font-mono in MyVouchersPage
    cy.contains('WELCOME10').should('be.visible');
    cy.contains('พร้อมใช้งาน').should('be.visible');
    cy.contains('a', 'ใช้ในการสั่งซื้อ').should('have.attr', 'href', '/cart');

    cy.contains('button', 'ใช้แล้ว (0)').click();
    cy.contains('ไม่มีโค้ดส่วนลดในสถานะนี้').should('be.visible');

    cy.contains('button', 'หมดอายุ (0)').click();
    cy.contains('ไม่มีโค้ดส่วนลดในสถานะนี้').should('be.visible');
  });

  it('shows voucher navigation parity for Seller role and enforces minimum-spend & custom-code rules in checkout', () => {
    const claimedAt = new Date().toISOString();
    const seededWallet = [
      {
        id: 101,
        voucherId: 1,
        code: 'WELCOME10',
        title: 'ส่วนลด 10% สมาชิกใหม่',
        description: 'ลด 10% สูงสุด 100 บาท เมื่อซื้อขั้นต่ำ 300 บาท',
        discountType: 'PERCENTAGE' as const,
        discountValue: 10,
        minSpend: 300,
        maxDiscountAmount: 100,
        status: 'CLAIMED' as const,
        claimedAt,
        usedAt: null,
        endTime: offsetIsoFromNow(90),
        startTime: offsetIsoFromNow(-1),
        isActive: true,
      },
      {
        id: 102,
        voucherId: 3,
        code: 'FLASH100',
        title: 'Flash Sale ฿100',
        description: 'ลด 100 บาท สำหรับยอดสั่งซื้อตั้งแต่ 1,000 บาทขึ้นไป',
        discountType: 'FIXED_AMOUNT' as const,
        discountValue: 100,
        minSpend: 1000,
        maxDiscountAmount: null,
        status: 'CLAIMED' as const,
        claimedAt,
        usedAt: null,
        endTime: offsetIsoFromNow(30),
        startTime: offsetIsoFromNow(-1),
        isActive: true,
      },
    ];

    // Subtotal = ฿600 -> WELCOME10 (min 300) eligible, FLASH100 (min 1000) ineligible
    visitWithMockVoucherState('/checkout', {
      role: 'SELLER',
      listings: [LISTING_CHARIZARD_600],
      cartItems: [{ listing: LISTING_CHARIZARD_600, quantity: 1 }],
      userVouchers: seededWallet,
    });

    // Verify Seller top navbar includes Voucher Center
    cy.get('nav[aria-label="Marketplace navigation"] a[href="/vouchers"]')
      .should('be.visible')
      .and('contain.text', 'Voucher Center');

    cy.contains('h1', 'Order Review').should('be.visible');
    cy.contains('button', 'เลือกหรือใส่โค้ดส่วนลด').click();

    cy.contains('h2', 'เลือกโค้ดส่วนลด Mythix').should('be.visible');

    // Eligible vs Ineligible sections
    cy.contains('h3', 'โค้ดส่วนลดที่ใช้ได้ (1)').parent().within(() => {
      voucherCardByCode('WELCOME10').within(() => {
        cy.contains('button', 'ใช้โค้ด').should('not.be.disabled');
      });
    });

    cy.contains('h3', 'โค้ดส่วนลดที่ยังไม่ถึงเกณฑ์ (1)').parent().within(() => {
      voucherCardByCode('FLASH100').within(() => {
        cy.contains('ซื้อเพิ่มอีก ฿400.00 เพื่อใช้โค้ดนี้').should('be.visible');
        cy.contains('button', 'ใช้โค้ด').should('be.disabled');
      });
    });

    // Custom promo code negative cases
    cy.contains('form', 'ใส่โค้ดส่วนลดโปรโมชัน').within(() => {
      cy.get('input').type('NOTEXIST99');
      cy.contains('button', 'ใช้โค้ด').click();
    });
    cy.contains('ไม่พบโค้ดส่วนลดนี้').should('be.visible');

    cy.contains('form', 'ใส่โค้ดส่วนลดโปรโมชัน').within(() => {
      cy.get('input').clear().type('FLASH100');
      cy.contains('button', 'ใช้โค้ด').click();
    });
    cy.contains('ยอดสั่งซื้อขั้นต่ำ ฿1,000').should('be.visible');

    // Valid custom code MYTHIX50 (฿50 off for >= ฿500)
    cy.contains('form', 'ใส่โค้ดส่วนลดโปรโมชัน').within(() => {
      cy.get('input').clear().type('MYTHIX50');
      cy.contains('button', 'ใช้โค้ด').click();
    });
    cy.contains('กำลังเลือกใช้โค้ด').should('be.visible');
    cy.contains('MYTHIX50 - โค้ดส่วนลด MYTHIX50').should('be.visible');

    cy.contains('button', 'ตกลง').click();

    // Discount breakdown reflects ฿50 off ฿600 = ฿550
    cy.contains('ส่วนลดจากโค้ด').should('be.visible');
    cy.contains('-฿50.00').should('be.visible');
    cy.contains('Confirm reservation (฿550.00)').should('be.visible');

    // Remove voucher restores full subtotal
    cy.contains('button', 'MYTHIX50').click();
    cy.contains('button', 'ยกเลิกการใช้โค้ด').click();
    cy.contains('ส่วนลดจากโค้ด').should('not.exist');
    cy.contains('Confirm reservation (฿600.00)').should('be.visible');
  });

  it('applies percentage cap on checkout, completes reservation, shows confirmation & order detail, and marks voucher used', () => {
    // 1. Login as Buyer and claim WELCOME10 (10%, cap ฿100)
    visitWithMockVoucherState('/vouchers', {
      role: 'CUSTOMER',
      listings: [LISTING_PIKACHU_2000],
      cartItems: [{ listing: LISTING_PIKACHU_2000, quantity: 1 }],
    });

    voucherCardByCode('WELCOME10').within(() => {
      cy.contains('button', 'เก็บโค้ด').click();
      cy.contains('button', 'เก็บแล้ว').should('be.disabled');
    });

    // 2. Visit Checkout (Subtotal = ฿2,000 -> 10% = ฿200, capped at ฿100!)
    cy.visit('/checkout');
    cy.contains('h1', 'Order Review').should('be.visible');

    cy.contains('button', 'เลือกหรือใส่โค้ดส่วนลด').click();
    cy.contains('h3', 'โค้ดส่วนลดที่ใช้ได้ (1)').parent().within(() => {
      voucherCardByCode('WELCOME10').within(() => {
        cy.contains('button', 'ใช้โค้ด').click();
      });
    });
    cy.contains('button', 'ตกลง').click();

    // 3. Assert capped discount & unchanged seller platform fee (5% of 2,000 = ฿100.00)
    cy.contains('WELCOME10 (฿100.00)').should('be.visible');
    cy.contains('ส่วนลดจากโค้ด').should('be.visible');
    cy.contains('-฿100.00').should('be.visible');
    cy.contains('Confirm reservation (฿1,900.00)').should('be.visible').click();

    // 4. Confirmation page breakdown & Platform Subsidy notice
    cy.location('pathname').should('eq', '/checkout/confirmation');
    cy.contains('h1', 'Reservation placed!').should('be.visible');
    cy.contains('WELCOME10').should('be.visible');
    cy.contains('- ฿100.00').should('be.visible');
    cy.contains('฿1,900.00').should('be.visible');
    cy.contains('ทางผู้ขายจะได้รับเงินเต็ม ฿2,000.00 ตามราคาตั้งขาย').should('be.visible');

    // 5. Inspect order in My Orders & click Order Details to navigate to Order Detail page
    cy.location('search').then((search) => {
      const orderId = new URLSearchParams(search).get('orderIds')?.split(',')[0] || '';
      expect(orderId).to.match(/^ord-/i);

      cy.contains('a', 'View my orders').click();
      cy.location('pathname').should('eq', '/orders');
      cy.contains(`#${orderId.toUpperCase()}`).should('be.visible');
      cy.contains('฿1,900').should('be.visible');
      cy.contains('button', 'Order Details').first().click();

      cy.location('pathname').should('eq', `/orders/${orderId}`);
      cy.contains('Voucher Discount (WELCOME10)').should('be.visible');
      cy.contains('-฿100').should('be.visible');
      cy.contains('฿1,900').should('be.visible');
    });

    // 6. Wallet now moves WELCOME10 from CLAIMED -> USED and increments catalog usedQuota
    cy.visit('/profile/vouchers');
    cy.contains('button', 'พร้อมใช้งาน (0)').should('be.visible');
    cy.contains('ไม่มีโค้ดส่วนลดในสถานะนี้').should('be.visible');

    cy.contains('button', 'ใช้แล้ว (1)').click();
    cy.contains('WELCOME10').should('be.visible');
    cy.contains('ใช้สิทธิ์แล้ว').should('be.visible');

    cy.window().should((win) => {
      const catalog = JSON.parse(win.localStorage.getItem(VOUCHER_CATALOG_STORAGE_KEY) || '[]');
      const welcome = catalog.find((v: { code: string }) => v.code === 'WELCOME10');
      expect(welcome.usedQuota).to.eq(46);
      expect(welcome.remainingQuota).to.eq(454);

      const wallet = JSON.parse(win.localStorage.getItem(USER_VOUCHER_STORAGE_KEY) || '[]');
      expect(wallet[0].status).to.eq('USED');
      expect(wallet[0].usedAt).to.be.a('string');
    });
  });
});
