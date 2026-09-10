import apiClient from '@/shared/api/client';

export interface SellerOrderItem {
  itemId: number | string;
  cardId: string;
  productName: string;
  unitPrice: number;
  unitCost: number;
  itemProfit: number;
  quantity: number;
  itemTotal: number;
}

export interface SellerOrder {
  id: number | string;
  orderNumber: string;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED' | string;
  buyerId?: number | string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerContactLine?: string;
  buyerContactFacebook?: string;
  sellerRevenue: number;
  sellerCost: number;
  sellerProfit: number;
  items: SellerOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface SellerProfitSummary {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  cancelledOrders: number;
}

export interface SellerOrdersPageResponse {
  orders: SellerOrder[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

// Default in-memory mock fallback data
const fallbackOrders: SellerOrder[] = [
  {
    id: 1,
    orderNumber: 'ORD-2026-001',
    status: 'PENDING',
    buyerId: 101,
    buyerName: 'Kittipong Wongsuwan',
    buyerEmail: 'kittipong@example.com',
    buyerPhone: '089-123-4567',
    buyerContactLine: 'kittipong_tcg',
    buyerContactFacebook: 'Kittipong W.',
    sellerRevenue: 1250,
    sellerCost: 750,
    sellerProfit: 500,
    createdAt: '2026-09-08T10:15:00Z',
    items: [
      {
        itemId: 1,
        cardId: 'sv03-015',
        productName: 'Charizard ex - Obsidian Flames (Special Art Rare)',
        unitPrice: 1250,
        unitCost: 750,
        itemProfit: 500,
        quantity: 1,
        itemTotal: 1250,
      },
    ],
  },
  {
    id: 2,
    orderNumber: 'ORD-2026-002',
    status: 'FULFILLED',
    buyerId: 102,
    buyerName: 'Piyawat Santisuk',
    buyerEmail: 'piyawat@example.com',
    buyerPhone: '081-987-6543',
    buyerContactLine: 'piyawat_cards',
    buyerContactFacebook: 'Piyawat S.',
    sellerRevenue: 2400,
    sellerCost: 1400,
    sellerProfit: 1000,
    createdAt: '2026-09-07T14:30:00Z',
    items: [
      {
        itemId: 2,
        cardId: 'sv04-182',
        productName: 'Roaring Moon ex - Paradox Rift (Special Illustration Rare)',
        unitPrice: 1200,
        unitCost: 700,
        itemProfit: 500,
        quantity: 2,
        itemTotal: 2400,
      },
    ],
  },
  {
    id: 3,
    orderNumber: 'ORD-2026-003',
    status: 'CANCELLED',
    buyerId: 103,
    buyerName: 'Tanaporn Chaiyo',
    buyerEmail: 'tanaporn@example.com',
    buyerPhone: '086-555-1234',
    buyerContactLine: 'tanaporn_t',
    sellerRevenue: 600,
    sellerCost: 350,
    sellerProfit: 250,
    createdAt: '2026-09-06T09:20:00Z',
    items: [
      {
        itemId: 3,
        cardId: 'op05-119',
        productName: 'Monkey.D.Luffy (Gear 5 Secret Rare)',
        unitPrice: 600,
        unitCost: 350,
        itemProfit: 250,
        quantity: 1,
        itemTotal: 600,
      },
    ],
  },
];

let localOrdersCache = [...fallbackOrders];

export async function fetchSellerOrders(
  page: number = 0,
  size: number = 20,
  status?: string
): Promise<SellerOrdersPageResponse> {
  try {
    const params: Record<string, unknown> = { page, size };
    if (status && status !== 'ALL') {
      params.status = status;
    }
    const res = await apiClient.get('/api/seller/orders', { params });
    const data = res.data;
    if (data && Array.isArray(data.content)) {
      return {
        orders: data.content,
        totalPages: data.totalPages ?? 1,
        totalElements: data.totalElements ?? data.content.length,
        currentPage: data.number ?? page,
      };
    }
  } catch {
    // Graceful fallback to mock data
  }

  let filtered = [...localOrdersCache];
  if (status && status !== 'ALL') {
    filtered = filtered.filter((o) => o.status.toUpperCase() === status.toUpperCase());
  }
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const paged = filtered.slice(page * size, (page + 1) * size);

  return {
    orders: paged,
    totalPages,
    totalElements,
    currentPage: page,
  };
}

export async function updateSellerOrderStatus(
  orderId: number | string,
  newStatus: string
): Promise<SellerOrder> {
  try {
    const res = await apiClient.patch(`/api/seller/orders/${orderId}/status`, {
      status: newStatus.toUpperCase(),
    });
    if (res.data) {
      // update cache
      localOrdersCache = localOrdersCache.map((o) =>
        String(o.id) === String(orderId) ? { ...o, status: newStatus.toUpperCase() } : o
      );
      return res.data;
    }
  } catch {
    // Fallback update
  }

  localOrdersCache = localOrdersCache.map((o) =>
    String(o.id) === String(orderId) ? { ...o, status: newStatus.toUpperCase() } : o
  );
  const found = localOrdersCache.find((o) => String(o.id) === String(orderId));
  if (!found) {
    throw new Error('Order not found');
  }
  return found;
}

export async function fetchProfitSummary(): Promise<SellerProfitSummary> {
  try {
    const res = await apiClient.get('/api/seller/orders/profit');
    if (res.data) {
      return res.data;
    }
  } catch {
    // Fallback calculation
  }

  let totalRevenue = 0;
  let totalCost = 0;
  let pendingOrders = 0;
  let fulfilledOrders = 0;
  let cancelledOrders = 0;

  for (const o of localOrdersCache) {
    if (o.status === 'PENDING') pendingOrders++;
    else if (o.status === 'FULFILLED') fulfilledOrders++;
    else if (o.status === 'CANCELLED') cancelledOrders++;

    if (o.status !== 'CANCELLED') {
      totalRevenue += o.sellerRevenue;
      totalCost += o.sellerCost;
    }
  }

  return {
    totalRevenue,
    totalCost,
    netProfit: totalRevenue - totalCost,
    totalOrders: localOrdersCache.length,
    pendingOrders,
    fulfilledOrders,
    cancelledOrders,
  };
}
