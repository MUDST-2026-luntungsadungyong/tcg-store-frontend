/// <reference types="cypress" />
import {
  defaultMockVouchers,
  offsetIsoFromNow,
  toLocalDateTimeInput,
  visitWithMockVoucherState,
} from '../../support/vouchers';

describe('Admin Discounts & Vouchers Management (Mock DB)', () => {
  it('enforces RBAC on /admin/vouchers and verifies navbar/sidebar parity for Admin', () => {
    // 1. Unauthenticated -> /login
    visitWithMockVoucherState('/admin/vouchers', { role: null });
    cy.location('pathname').should('eq', '/login');

    // 2. Non-admin Buyer -> /
    visitWithMockVoucherState('/admin/vouchers', { role: 'CUSTOMER' });
    cy.location('pathname').should('eq', '/');

    // 3. Non-admin Seller -> /
    visitWithMockVoucherState('/admin/vouchers', { role: 'SELLER' });
    cy.location('pathname').should('eq', '/');

    // 4. Admin sees top Marketplace Navbar parity, Admin Sidebar link, Account Menu link, and Public Voucher Center button
    visitWithMockVoucherState('/admin/vouchers', { role: 'ADMIN' });
    cy.contains('h1', 'Discounts & Vouchers').should('be.visible');

    cy.get('nav[aria-label="Marketplace navigation"]').within(() => {
      cy.get('a[href="/"]').should('contain.text', 'Home');
      cy.get('a[href="/cards"]').should('contain.text', 'Cards');
      cy.get('a[href="/collections"]').should('contain.text', 'Collections');
      cy.get('a[href="/auctions"]').should('contain.text', 'Auctions');
      cy.get('a[href="/vouchers"]').should('contain.text', 'Voucher Center');
    });

    cy.get('aside[aria-label="Platform administration"]').within(() => {
      cy.get('a[href="/admin/vouchers"]')
        .should('be.visible')
        .and('have.attr', 'aria-current', 'page')
        .and('contain.text', 'Discounts & Vouchers');
      cy.get('a[href="/vouchers"]').should('be.visible').and('contain.text', 'Voucher Center');
    });

    cy.get('a[href="/vouchers"]').contains('Public Voucher Center').should('be.visible');
  });

  it('displays KPI metrics and filters vouchers by search query, discount type, and effective status', () => {
    const vouchers = [
      ...defaultMockVouchers(),
      {
        id: 10,
        code: 'PAUSED20',
        title: 'Paused Promo',
        description: 'Temporarily paused discount',
        discountType: 'FIXED_AMOUNT' as const,
        discountValue: 20,
        minSpend: 200,
        maxDiscountAmount: null,
        totalQuota: 50,
        usedQuota: 0,
        remainingQuota: 50,
        quotaPercentage: 0,
        startTime: offsetIsoFromNow(-2),
        endTime: offsetIsoFromNow(10),
        isActive: false,
      },
      {
        id: 11,
        code: 'FUTURE30',
        title: 'Upcoming Campaign',
        description: 'Starts tomorrow',
        discountType: 'PERCENTAGE' as const,
        discountValue: 30,
        minSpend: 500,
        maxDiscountAmount: 300,
        totalQuota: 80,
        usedQuota: 0,
        remainingQuota: 80,
        quotaPercentage: 0,
        startTime: offsetIsoFromNow(2),
        endTime: offsetIsoFromNow(20),
        isActive: true,
      },
      {
        id: 12,
        code: 'EMPTY50',
        title: 'Fully Redeemed',
        description: 'Exhausted quota',
        discountType: 'FIXED_AMOUNT' as const,
        discountValue: 50,
        minSpend: 300,
        maxDiscountAmount: null,
        totalQuota: 10,
        usedQuota: 10,
        remainingQuota: 0,
        quotaPercentage: 100,
        startTime: offsetIsoFromNow(-5),
        endTime: offsetIsoFromNow(10),
        isActive: true,
      },
      {
        id: 13,
        code: 'OLDEXP15',
        title: 'Expired Campaign',
        description: 'Ended yesterday',
        discountType: 'PERCENTAGE' as const,
        discountValue: 15,
        minSpend: 300,
        maxDiscountAmount: 100,
        totalQuota: 40,
        usedQuota: 5,
        remainingQuota: 35,
        quotaPercentage: 13,
        startTime: offsetIsoFromNow(-10),
        endTime: offsetIsoFromNow(-1),
        isActive: true,
      },
    ];

    visitWithMockVoucherState('/admin/vouchers', {
      role: 'ADMIN',
      vouchers,
      userVouchers: [
        {
          id: 501,
          voucherId: 1,
          code: 'WELCOME10',
          title: 'ส่วนลด 10% สมาชิกใหม่',
          description: 'ลด 10%',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minSpend: 300,
          maxDiscountAmount: 100,
          status: 'CLAIMED',
          claimedAt: new Date().toISOString(),
          usedAt: null,
          endTime: offsetIsoFromNow(90),
          startTime: offsetIsoFromNow(-1),
          isActive: true,
        },
      ],
    });

    // KPI cards: 8 total, 4 active, 1 claimed in wallet, 295 total redemptions
    cy.get('section[aria-label="Voucher summary metrics"]').within(() => {
      cy.contains('article', 'Total vouchers').should('contain.text', '8');
      cy.contains('article', 'Active now').should('contain.text', '4');
      cy.contains('article', 'Wallet claims').should('contain.text', '1');
      cy.contains('article', 'Total redemptions').should('contain.text', '295');
    });

    // Filter by status pills
    cy.get('div[aria-label="Filter by voucher status"]').within(() => {
      cy.contains('button', 'Inactive').click();
    });
    cy.get('table').should('contain.text', 'PAUSED20').and('not.contain.text', 'WELCOME10');

    cy.get('div[aria-label="Filter by voucher status"]').contains('button', 'Scheduled').click();
    cy.get('table').should('contain.text', 'FUTURE30').and('not.contain.text', 'PAUSED20');

    cy.get('div[aria-label="Filter by voucher status"]').contains('button', 'Exhausted').click();
    cy.get('table').should('contain.text', 'EMPTY50');

    cy.get('div[aria-label="Filter by voucher status"]').contains('button', 'Expired').click();
    cy.get('table').should('contain.text', 'OLDEXP15');

    cy.get('div[aria-label="Filter by voucher status"]').contains('button', 'All statuses').click();

    // Filter by discount type & search keyword
    cy.get('select[aria-label="Filter by discount type"]').select('FIXED_AMOUNT');
    cy.get('table').should('contain.text', 'MYTHIX50').and('not.contain.text', 'WELCOME10');

    cy.get('input[aria-label="Search vouchers"]').type('FLASH100');
    cy.get('table tbody tr').should('have.length', 1).and('contain.text', 'FLASH100');

    cy.get('input[aria-label="Search vouchers"]').clear().type('ZZZ_NOMATCH');
    cy.contains('No vouchers found').should('be.visible');
  });

  it('creates a new voucher with live preview, validates duplicate/date errors, and persists on reload', () => {
    visitWithMockVoucherState('/admin/vouchers', { role: 'ADMIN' });

    cy.contains('button', 'Create voucher').first().click();
    cy.get('[role="dialog"]:visible').should('be.visible').within(() => {
      cy.contains('h2', 'Create discount voucher').should('be.visible');

      // Fixed amount disables Max discount cap
      cy.get('#voucher-discount-type').select('FIXED_AMOUNT');
      cy.get('#voucher-max-discount').should('be.disabled');

      // Switch to Percentage enables Max discount cap
      cy.get('#voucher-discount-type').select('PERCENTAGE');
      cy.get('#voucher-max-discount').should('not.be.disabled');

      // Try duplicate code WELCOME10 first
      cy.get('#voucher-code').clear().type('welcome 10');
      cy.get('#voucher-code').should('have.value', 'WELCOME10');
      cy.get('#voucher-title').clear().type('Duplicate Test');
      cy.get('#voucher-discount-value').clear().type('15');
      cy.get('#voucher-total-quota').clear().type('50');
      cy.contains('button', 'Create voucher').click();

      cy.get('[role="alert"]').should('contain.text', "Voucher code 'WELCOME10' already exists");

      // Invalid schedule check (end <= start)
      const now = new Date();
      const earlier = new Date(now.getTime() - 3_600_000);
      cy.get('#voucher-code').clear().type('NEWYEAR25');
      cy.get('#voucher-title').clear().type('New Year 25%');
      cy.get('#voucher-description').clear().type('Save 25% capped at ฿250');
      cy.get('#voucher-discount-value').clear().type('25');
      cy.get('#voucher-max-discount').clear().type('250');
      cy.get('#voucher-min-spend').clear().type('500');
      cy.get('#voucher-total-quota').clear().type('75');
      cy.get('#voucher-start-time').clear().type(toLocalDateTimeInput(now));
      cy.get('#voucher-end-time').clear().type(toLocalDateTimeInput(earlier));
      cy.contains('button', 'Create voucher').click();

      cy.get('[role="alert"]').should('contain.text', 'End date & time must be after start date & time');

      // Verify Live Buyer Ticket Preview reflects typed details
      cy.contains('Live Buyer Ticket Preview').parent().within(() => {
        cy.contains('code', 'NEWYEAR25').should('be.visible');
        cy.contains('New Year 25%').should('be.visible');
        cy.contains('25%').should('be.visible');
        cy.contains('ลดสูงสุด ฿250').should('be.visible');
      });

      // Fix end date & submit valid voucher
      const nextMonth = new Date(now.getTime() + 30 * 24 * 3_600_000);
      cy.get('#voucher-end-time').clear().type(toLocalDateTimeInput(nextMonth));
      cy.contains('button', 'Create voucher').click();
    });

    cy.contains('Voucher NEWYEAR25 created and published.').should('be.visible');
    cy.get('table').contains('tr', 'NEWYEAR25').should('contain.text', '25% off').and('contain.text', 'Cap ฿250');

    cy.reload();
    cy.get('table').contains('tr', 'NEWYEAR25').should('be.visible');
  });

  it('edits an existing voucher, enforces usedQuota minimum, toggles Active/Paused status, and deletes via impact confirmation modal', () => {
    visitWithMockVoucherState('/admin/vouchers', {
      role: 'ADMIN',
      userVouchers: [
        {
          id: 901,
          voucherId: 1,
          code: 'WELCOME10',
          title: 'ส่วนลด 10% สมาชิกใหม่',
          description: 'ลด 10%',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minSpend: 300,
          maxDiscountAmount: 100,
          status: 'CLAIMED',
          claimedAt: new Date().toISOString(),
          usedAt: null,
          endTime: offsetIsoFromNow(90),
          startTime: offsetIsoFromNow(-1),
          isActive: true,
        },
      ],
    });

    // 1. Edit WELCOME10 (usedQuota = 45)
    cy.get('table').contains('tr', 'WELCOME10').find('button[aria-label="Edit WELCOME10"]').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.contains('Already redeemed: 45').should('be.visible');
      // Native min=45 prevents lowering totalQuota below 45
      cy.get('#voucher-total-quota').clear().type('10');
      cy.get('#voucher-total-quota').should(($input) => {
        expect(($input[0] as HTMLInputElement).checkValidity()).to.eq(false);
      });

      // Valid edit
      cy.get('#voucher-title').clear().type('ส่วนลด 10% อัปเดตใหม่');
      cy.get('#voucher-total-quota').clear().type('600');
      cy.contains('button', 'Save changes').click();
    });

    cy.contains('Voucher WELCOME10 updated and synced.').should('be.visible');
    cy.get('table').contains('tr', 'WELCOME10')
      .should('contain.text', 'ส่วนลด 10% อัปเดตใหม่')
      .and('contain.text', '45 / 600 used');

    // 2. Toggle status Disable -> Enable
    cy.get('table').contains('tr', 'WELCOME10').find('button[aria-label="Disable WELCOME10"]').click();
    cy.contains('WELCOME10 is now paused.').should('be.visible');
    cy.get('table').contains('tr', 'WELCOME10').should('contain.text', 'Paused / Off');
    cy.get('section[aria-label="Voucher summary metrics"]').contains('article', 'Active now').should('contain.text', '3');

    cy.get('table').contains('tr', 'WELCOME10').find('button[aria-label="Enable WELCOME10"]').click();
    cy.contains('WELCOME10 is now active.').should('be.visible');
    cy.get('table').contains('tr', 'WELCOME10').should('contain.text', 'Active');

    // 3. Delete confirmation modal ("Pause instead" first, then "Delete permanently")
    cy.get('table').contains('tr', 'WELCOME10').find('button[aria-label="Delete WELCOME10"]').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.contains('Delete discount voucher').should('be.visible');
      cy.contains('Wallet impact:').should('contain.text', '1 buyer wallet claim(s)');
      cy.contains('Order history:').should('contain.text', '45 existing order(s)');
      cy.contains('button', 'Pause instead').click();
    });

    cy.contains('WELCOME10 is now paused.').should('be.visible');
    cy.get('table').contains('tr', 'WELCOME10').find('button[aria-label="Delete WELCOME10"]').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.contains('button', 'Delete permanently').click();
    });

    cy.contains('Voucher WELCOME10 deleted.').should('be.visible');
    cy.get('table').should('not.contain.text', 'WELCOME10');
  });
});
