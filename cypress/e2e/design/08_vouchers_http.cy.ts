/// <reference types="cypress" />
import {
  buildTestUser,
  defaultMockVouchers,
  offsetIsoFromNow,
  toLocalDateTimeInput,
  visitWithHttpVoucherSession,
  voucherCardByCode,
} from '../../support/vouchers';

type EffectiveStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXHAUSTED' | 'EXPIRED';

describe('US-Voucher HTTP API Contract & Audit Trail (Port 3001 HTTP Mode)', () => {
  const adminBaseVoucher = {
    ...defaultMockVouchers()[0],
    effectiveStatus: 'ACTIVE' as EffectiveStatus,
    claimedCount: 3,
    usedOrdersCount: 45,
    createdAt: offsetIsoFromNow(-1),
    updatedAt: new Date().toISOString(),
  };

  it('exercises Admin Voucher HTTP CRUD endpoints, 409 conflict handling, and Audit Log filtering', () => {
    let adminRows: Array<typeof adminBaseVoucher> = [{ ...adminBaseVoucher }];

    cy.intercept('GET', '**/api/admin/vouchers*', (req) => {
      const url = new URL(req.url);
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const status = url.searchParams.get('status') || '';
      const type = url.searchParams.get('discountType') || '';
      const filtered = adminRows
        .filter((v) => !search || v.code.toLowerCase().includes(search) || v.title.toLowerCase().includes(search))
        .filter((v) => !status || v.effectiveStatus === status)
        .filter((v) => !type || v.discountType === type);
      req.reply({ statusCode: 200, body: filtered });
    }).as('listAdminVouchers');

    let createAttempts = 0;
    cy.intercept('POST', '**/api/admin/vouchers', (req) => {
      createAttempts += 1;
      if (createAttempts === 1) {
        req.reply({
          statusCode: 409,
          body: {
            code: 'VOUCHER_CODE_EXISTS',
            message: `Voucher code '${req.body.code}' already exists`,
            fieldErrors: { code: `Voucher code '${req.body.code}' already exists` },
          },
        });
        return;
      }
      expect(req.headers.authorization).to.include('e2e-http-jwt-admin');
      const created = {
        ...adminBaseVoucher,
        id: 22,
        code: req.body.code,
        title: req.body.title,
        description: req.body.description,
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        minSpend: req.body.minSpend,
        maxDiscountAmount: req.body.maxDiscountAmount,
        totalQuota: req.body.totalQuota,
        usedQuota: 0,
        remainingQuota: req.body.totalQuota,
        quotaPercentage: 0,
        isActive: req.body.isActive,
        effectiveStatus: req.body.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
        claimedCount: 0,
        usedOrdersCount: 0,
      };
      adminRows = [created, ...adminRows];
      req.reply({ statusCode: 201, body: created });
    }).as('createAdminVoucher');

    cy.intercept('PATCH', '**/api/admin/vouchers/22/status', (req) => {
      expect(req.body).to.deep.equal({ isActive: false });
      adminRows = adminRows.map((v) =>
        v.id === 22 ? { ...v, isActive: false, effectiveStatus: 'INACTIVE' as const } : v,
      );
      req.reply({ statusCode: 200, body: adminRows.find((v) => v.id === 22) });
    }).as('toggleVoucher');

    cy.intercept('PUT', '**/api/admin/vouchers/22', (req) => {
      adminRows = adminRows.map((v) => (v.id === 22 ? { ...v, title: req.body.title } : v));
      req.reply({ statusCode: 200, body: adminRows.find((v) => v.id === 22) });
    }).as('updateVoucher');

    cy.intercept('DELETE', '**/api/admin/vouchers/22', (req) => {
      adminRows = adminRows.filter((v) => v.id !== 22);
      req.reply({ statusCode: 204, body: '' });
    }).as('deleteVoucher');

    visitWithHttpVoucherSession('/admin/vouchers', 'ADMIN');
    cy.wait('@listAdminVouchers').its('response.statusCode').should('eq', 200);
    cy.get('table').should('contain.text', 'WELCOME10');

    // Create with initial 409 response then retry 201
    cy.contains('button', 'Create voucher').first().click();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 3_600_000);

    cy.get('[role="dialog"]:visible').within(() => {
      cy.get('#voucher-code').clear().type('HTTP200');
      cy.get('#voucher-discount-type').select('FIXED_AMOUNT');
      cy.get('#voucher-title').clear().type('HTTP Deal 200');
      cy.get('#voucher-discount-value').clear().type('200');
      cy.get('#voucher-min-spend').clear().type('1000');
      cy.get('#voucher-total-quota').clear().type('50');
      cy.get('#voucher-start-time').clear().type(toLocalDateTimeInput(now));
      cy.get('#voucher-end-time').clear().type(toLocalDateTimeInput(nextWeek));
      cy.contains('button', 'Create voucher').click();

      cy.wait('@createAdminVoucher').its('response.statusCode').should('eq', 409);
      cy.get('[role="alert"]').should('contain.text', "Voucher code 'HTTP200' already exists");

      cy.contains('button', 'Create voucher').click();
      cy.wait('@createAdminVoucher').its('response.statusCode').should('eq', 201);
    });
    cy.contains('Voucher HTTP200 created and published.').should('be.visible');

    // Toggle status via PATCH
    cy.get('table').contains('tr', 'HTTP200').find('button[aria-label="Disable HTTP200"]').click();
    cy.wait('@toggleVoucher').its('response.statusCode').should('eq', 200);
    cy.get('table').contains('tr', 'HTTP200').should('contain.text', 'Paused / Off');

    // Edit via PUT
    cy.get('table').contains('tr', 'HTTP200').find('button[aria-label="Edit HTTP200"]').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.get('#voucher-title').clear().type('HTTP Deal Updated');
      cy.contains('button', 'Save changes').click();
    });
    cy.wait('@updateVoucher').its('response.statusCode').should('eq', 200);
    cy.get('table').contains('tr', 'HTTP200').should('contain.text', 'HTTP Deal Updated');

    // Delete via DELETE
    cy.get('table').contains('tr', 'HTTP200').find('button[aria-label="Delete HTTP200"]').click();
    cy.get('[role="dialog"]:visible').contains('button', 'Delete permanently').click();
    cy.wait('@deleteVoucher').its('response.statusCode').should('eq', 204);
    cy.contains('Voucher HTTP200 deleted.').should('be.visible');

    // Verify voucher audit log action pills on /admin/audit-logs
    cy.intercept('GET', '**/api/admin/audit-logs*', (req) => {
      req.alias = req.url.includes('actions=CREATE_VOUCHER') ? 'getFilteredAuditLogs' : 'getAuditLogs';
      req.reply({
        statusCode: 200,
        body: {
          content: [
            {
              id: 'log-v-1',
              action: 'CREATE_VOUCHER',
              targetType: 'VOUCHER',
              targetId: '22',
              actorId: 'usr-2',
              actorName: 'Admin Demo',
              actorEmail: 'admin@mythix.com',
              actorRole: 'ADMIN',
              details: JSON.stringify({ code: 'HTTP200', discountValue: 200 }),
              createdAt: new Date().toISOString(),
            },
          ],
          number: 0,
          totalPages: 1,
          totalElements: 1,
        },
      });
    });

    cy.visit('/admin/audit-logs');
    cy.wait('@getAuditLogs');
    cy.contains('button', 'CREATE_VOUCHER').should('be.visible').click();
    cy.wait('@getFilteredAuditLogs').its('request.url').should('include', 'actions=CREATE_VOUCHER');
    cy.get('table').contains('tr', 'CREATE_VOUCHER').click();
    cy.get('[role="dialog"]:visible').should('contain.text', 'HTTP200');
  });

  it('exercises Buyer Voucher Claim, Validate, and Checkout Order Creation HTTP contracts', () => {
    const buyer = buildTestUser('CUSTOMER');
    let claimed = false;
    const baseVoucher = { ...defaultMockVouchers()[0] };
    const claimedUserVoucher = {
      id: 301,
      voucherId: baseVoucher.id,
      code: baseVoucher.code,
      title: baseVoucher.title,
      description: baseVoucher.description,
      discountType: baseVoucher.discountType,
      discountValue: baseVoucher.discountValue,
      minSpend: baseVoucher.minSpend,
      maxDiscountAmount: baseVoucher.maxDiscountAmount,
      status: 'CLAIMED' as const,
      claimedAt: new Date().toISOString(),
      usedAt: null,
      startTime: baseVoucher.startTime,
      endTime: baseVoucher.endTime,
      isActive: true,
    };

    const cartResponse = {
      items: [
        {
          listingId: 'prd-1',
          sellerId: 'usr-3',
          name: 'Trophy Pikachu - #3',
          game: 'Pokemon',
          image: '/assets/expensive_card_1.png',
          price: 2000,
          condition: 'Near Mint-Mint 8',
          set: 'P.M. JAPANESE PROMO',
          rarity: 'Promotional Trophy Card',
          quantity: 1,
          available: true,
          availableQuantity: 3,
          subtotal: 2000,
        },
      ],
      totalItems: 1,
      totalAmount: 2000,
    };

    const orderResponse = {
      id: '901',
      orderNumber: 'ORD-20261111-901',
      buyerId: buyer.id,
      sellerId: 'usr-3',
      status: 'PENDING',
      subtotalAmount: 2000,
      discountAmount: 100,
      totalAmount: 1900,
      platformFee: 100,
      sellerNetAmount: 1900,
      voucherCode: 'WELCOME10',
      items: [
        {
          listingId: 'prd-1',
          sellerId: 'usr-3',
          name: 'Trophy Pikachu - #3',
          price: 2000,
          quantity: 1,
          subtotal: 2000,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    cy.intercept('GET', '**/api/vouchers', (req) => {
      req.reply({
        statusCode: 200,
        body: [{ ...baseVoucher, isClaimed: claimed, canClaim: !claimed }],
      });
    }).as('getAvailableVouchers');

    cy.intercept('POST', '**/api/vouchers/1/claim', (req) => {
      expect(req.headers.authorization).to.include('e2e-http-jwt-customer');
      claimed = true;
      req.reply({ statusCode: 200, body: claimedUserVoucher });
    }).as('claimVoucher');

    cy.intercept('GET', '**/api/vouchers/my-vouchers*', (req) => {
      req.reply({ statusCode: 200, body: claimed ? [claimedUserVoucher] : [] });
    }).as('getMyVouchers');

    cy.intercept('POST', '**/api/vouchers/validate', (req) => {
      expect(req.body).to.deep.equal({ code: 'WELCOME10', subtotal: 2000 });
      req.reply({
        statusCode: 200,
        body: {
          valid: true,
          code: 'WELCOME10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          discountAmount: 100,
          subtotal: 2000,
          finalTotal: 1900,
          message: 'ใช้ส่วนลดได้สำเร็จ ลดทันที ฿100',
        },
      });
    }).as('validateVoucher');

    cy.intercept('GET', '**/api/cart', { statusCode: 200, body: cartResponse }).as('getCart');
    cy.intercept('GET', '**/api/platform/fee-policy', {
      statusCode: 200,
      body: { rate: 0.05, minimumFee: 20 },
    }).as('getFeePolicy');

    cy.intercept('POST', '**/api/orders', (req) => {
      expect(req.body).to.deep.equal({ voucherCode: 'WELCOME10' });
      req.reply({ statusCode: 201, body: orderResponse });
    }).as('createOrder');

    cy.intercept('GET', '**/api/orders/901', { statusCode: 200, body: orderResponse }).as('getOrder901');

    // 1. Claim on /vouchers via HTTP
    visitWithHttpVoucherSession('/vouchers', 'CUSTOMER');
    cy.wait('@getAvailableVouchers').its('response.statusCode').should('eq', 200);
    voucherCardByCode('WELCOME10').within(() => {
      cy.contains('button', 'เก็บโค้ด').click();
    });
    cy.wait('@claimVoucher').its('response.statusCode').should('eq', 200);
    cy.contains('เก็บโค้ดส่วนลดสำเร็จ!').should('be.visible');

    // 2. Navigate to /cart -> /checkout -> apply code via custom promo form (exercises POST /vouchers/validate)
    cy.get('nav[aria-label="Marketplace navigation"] a[href="/cart"]:visible').click();
    cy.wait('@getCart');
    cy.contains('a', 'Review reservation').click();
    cy.wait('@getFeePolicy');

    cy.contains('button', 'เลือกหรือใส่โค้ดส่วนลด').click();
    cy.wait('@getMyVouchers');

    cy.contains('form', 'ใส่โค้ดส่วนลดโปรโมชัน').within(() => {
      cy.get('input').type('WELCOME10');
      cy.contains('button', 'ใช้โค้ด').click();
    });
    cy.wait('@validateVoucher').its('response.statusCode').should('eq', 200);

    cy.contains('button', 'ตกลง').click();
    cy.contains('Confirm reservation (฿1,900.00)').should('be.visible').click();

    // 3. Verify POST /api/orders received { voucherCode: 'WELCOME10' } & Confirmation displays server numbers
    cy.wait('@createOrder').its('response.statusCode').should('eq', 201);
    cy.location('pathname').should('eq', '/checkout/confirmation');
    cy.wait('@getOrder901');
    cy.contains('ORD-20261111-901').should('be.visible');
    cy.contains('- ฿100.00').should('be.visible');
    cy.contains('฿1,900.00').should('be.visible');
    cy.contains('ทางผู้ขายจะได้รับเงินเต็ม ฿2,000.00 ตามราคาตั้งขาย').should('be.visible');
  });
});
