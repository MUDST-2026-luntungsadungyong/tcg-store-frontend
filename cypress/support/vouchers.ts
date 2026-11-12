/// <reference types="cypress" />

export const VOUCHER_CATALOG_STORAGE_KEY = 'mythix_mock_vouchers_v1';
export const USER_VOUCHER_STORAGE_KEY = 'mythix_mock_user_vouchers_v1';
export const VOUCHER_BROADCAST_CHANNEL = 'mythix_vouchers';
export const VOUCHER_DOM_EVENT = 'mythix:vouchers-changed';
export const MOCK_USERS_STORAGE_KEY = 'mythix_mock_users_v6';
export const MOCK_LISTINGS_STORAGE_KEY = 'mythix_mock_listings_v2';
export const MOCK_RESERVATIONS_STORAGE_KEY = 'mythix_mock_reservations_v1';
export const MOCK_CART_STORAGE_PREFIX = 'mythix_reservation_cart_v2:';

export type VoucherTestRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface MockVoucherSeed {
  id: number;
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minSpend: number;
  maxDiscountAmount: number | null;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  quotaPercentage: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface MockUserVoucherSeed {
  id: number;
  voucherId: number;
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minSpend: number;
  maxDiscountAmount: number | null;
  status: 'CLAIMED' | 'USED' | 'EXPIRED';
  claimedAt: string;
  usedAt: string | null;
  endTime: string | null;
  startTime?: string | null;
  isActive?: boolean;
}

export interface MockListingSeed {
  id: string;
  sellerId: string;
  name: string;
  game: string;
  image: string;
  price: number;
  cost: number;
  stock: number;
  status: 'SHOW' | 'HIDE';
  set?: string;
  condition?: string;
  rarity?: string;
  cardNumber?: string;
}

export function offsetIsoFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function toLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildTestUser(role: VoucherTestRole) {
  if (role === 'ADMIN') {
    return {
      id: 'usr-2',
      name: 'Admin Demo',
      email: 'admin@mythix.com',
      role: 'ADMIN' as const,
      isSeller: false,
      phone: '0898765432',
    };
  }
  if (role === 'SELLER') {
    return {
      id: 'usr-3',
      name: 'Brock Pewter',
      email: 'seller@mythix.com',
      role: 'USER' as const,
      isSeller: true,
      sellerStatus: 'APPROVED',
      phone: '0899998888',
    };
  }
  return {
    id: 'usr-1',
    name: 'Ash Ketchum',
    email: 'ash@mythix.com',
    role: 'USER' as const,
    isSeller: false,
    phone: '0811112222',
  };
}

export function defaultMockUsers() {
  return [
    buildTestUser('CUSTOMER'),
    buildTestUser('ADMIN'),
    buildTestUser('SELLER'),
  ];
}

export function defaultMockVouchers(): MockVoucherSeed[] {
  return [
    {
      id: 1,
      code: 'WELCOME10',
      title: 'ส่วนลด 10% สมาชิกใหม่',
      description: 'ลด 10% สูงสุด 100 บาท เมื่อซื้อขั้นต่ำ 300 บาท',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minSpend: 300,
      maxDiscountAmount: 100,
      totalQuota: 500,
      usedQuota: 45,
      remainingQuota: 455,
      quotaPercentage: 9,
      startTime: offsetIsoFromNow(-1),
      endTime: offsetIsoFromNow(90),
      isActive: true,
    },
    {
      id: 2,
      code: 'MYTHIX50',
      title: 'ส่วนลดพิเศษ ฿50',
      description: 'ลดทันที 50 บาท เมื่อช้อปการ์ดครบ 500 บาท',
      discountType: 'FIXED_AMOUNT',
      discountValue: 50,
      minSpend: 500,
      maxDiscountAmount: null,
      totalQuota: 300,
      usedQuota: 120,
      remainingQuota: 180,
      quotaPercentage: 40,
      startTime: offsetIsoFromNow(-1),
      endTime: offsetIsoFromNow(60),
      isActive: true,
    },
    {
      id: 3,
      code: 'FLASH100',
      title: 'Flash Sale ฿100',
      description: 'ลด 100 บาท สำหรับยอดสั่งซื้อตั้งแต่ 1,000 บาทขึ้นไป',
      discountType: 'FIXED_AMOUNT',
      discountValue: 100,
      minSpend: 1000,
      maxDiscountAmount: null,
      totalQuota: 100,
      usedQuota: 85,
      remainingQuota: 15,
      quotaPercentage: 85,
      startTime: offsetIsoFromNow(-1),
      endTime: offsetIsoFromNow(30),
      isActive: true,
    },
    {
      id: 4,
      code: 'POKEMON15',
      title: 'Mega Deal Pokemon 15%',
      description: 'ลด 15% สูงสุด 200 บาท เมื่อซื้อขั้นต่ำ 800 บาท',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minSpend: 800,
      maxDiscountAmount: 200,
      totalQuota: 200,
      usedQuota: 30,
      remainingQuota: 170,
      quotaPercentage: 15,
      startTime: offsetIsoFromNow(-1),
      endTime: offsetIsoFromNow(45),
      isActive: true,
    },
  ];
}

export const LISTING_PIKACHU_2000: MockListingSeed = {
  id: 'prd-1',
  sellerId: 'usr-3',
  name: 'Trophy Pikachu - #3',
  game: 'Pokemon',
  image: '/assets/expensive_card_1.png',
  price: 2000,
  cost: 1500,
  stock: 3,
  status: 'SHOW',
  set: 'P.M. JAPANESE PROMO',
  condition: 'Near Mint-Mint 8',
  rarity: 'Promotional Trophy Card',
};

export const LISTING_CHARIZARD_600: MockListingSeed = {
  id: 'prd-voucher-600',
  sellerId: 'usr-3',
  name: 'Charizard ex Special Illustration',
  game: 'Pokemon',
  image: '/assets/expensive_card_1.png',
  price: 600,
  cost: 400,
  stock: 5,
  status: 'SHOW',
  set: 'Obsidian Flames',
  condition: 'Near Mint',
  rarity: 'Special Illustration Rare',
};

export function voucherTokenForRole(role: VoucherTestRole, mode: 'mock' | 'http' = 'mock'): string {
  if (mode === 'http') {
    return role === 'ADMIN'
      ? 'e2e-http-jwt-admin'
      : role === 'SELLER'
      ? 'e2e-http-jwt-seller'
      : 'e2e-http-jwt-customer';
  }
  return role === 'ADMIN'
    ? 'mock-jwt-token-admin'
    : role === 'SELLER'
    ? 'mock-jwt-token-seller'
    : 'mock-jwt-token-customer';
}

export interface VisitMockOptions {
  role?: VoucherTestRole | null;
  vouchers?: MockVoucherSeed[];
  userVouchers?: MockUserVoucherSeed[];
  cartItems?: Array<{ listing: MockListingSeed; quantity: number }>;
  listings?: MockListingSeed[];
  reservations?: unknown[];
  preserveExistingVouchers?: boolean;
  preserveExistingReservations?: boolean;
}

export function applySessionToWindow(win: Window, role: VoucherTestRole | null, mode: 'mock' | 'http' = 'mock') {
  win.sessionStorage.removeItem('token');
  win.sessionStorage.removeItem('tcg_auth_storage');
  win.localStorage.removeItem('token');
  win.localStorage.removeItem('tcg_auth_storage');

  if (!role) return;

  const user = buildTestUser(role);
  const token = voucherTokenForRole(role, mode);
  win.localStorage.setItem('token', token);
  win.localStorage.setItem(
    'tcg_auth_storage',
    JSON.stringify({ state: { token, user, isAuthenticated: true }, version: 0 }),
  );
  win.localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(defaultMockUsers()));
}

export function visitWithMockVoucherState(path: string, options: VisitMockOptions = {}) {
  const {
    role = 'CUSTOMER',
    vouchers,
    userVouchers,
    cartItems,
    listings,
    reservations,
    preserveExistingVouchers = false,
    preserveExistingReservations = false,
  } = options;

  if (role) {
    const user = buildTestUser(role);
    cy.intercept('GET', '**/auth/me', { statusCode: 200, body: user });
    cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: user });
  }

  return cy.visit(path, {
    onBeforeLoad(win) {
      applySessionToWindow(win, role, 'mock');

      if (!preserveExistingVouchers) {
        win.localStorage.setItem(
          VOUCHER_CATALOG_STORAGE_KEY,
          JSON.stringify(vouchers ?? defaultMockVouchers()),
        );
        win.localStorage.setItem(
          USER_VOUCHER_STORAGE_KEY,
          JSON.stringify(userVouchers ?? []),
        );
      }

      if (listings) {
        win.localStorage.setItem(MOCK_LISTINGS_STORAGE_KEY, JSON.stringify(listings));
      }

      if (!preserveExistingReservations) {
        win.localStorage.setItem(
          MOCK_RESERVATIONS_STORAGE_KEY,
          JSON.stringify(reservations ?? []),
        );
      }

      if (cartItems) {
        const ownerId = role ? buildTestUser(role).id : 'usr-1';
        win.localStorage.setItem(`${MOCK_CART_STORAGE_PREFIX}${ownerId}`, JSON.stringify(cartItems));
      } else if (!preserveExistingVouchers) {
        win.localStorage.removeItem(`${MOCK_CART_STORAGE_PREFIX}usr-1`);
      }
    },
  });
}

/**
 * HTTP-fixture login helper that avoids the `mock-` token prefix so
 * `isMockVoucherSession()` evaluates to `false` on port 3001.
 */
export function visitWithHttpVoucherSession(path: string, role: VoucherTestRole) {
  const user = buildTestUser(role);
  cy.intercept('GET', '**/auth/me', { statusCode: 200, body: user });
  cy.intercept('GET', '**/api/users/profile', { statusCode: 200, body: user });

  return cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.sessionStorage.clear();
      applySessionToWindow(win, role, 'http');
    },
  });
}

export function voucherCardByCode(code: string) {
  return cy.contains('code', code).closest('div.rounded-2xl');
}
