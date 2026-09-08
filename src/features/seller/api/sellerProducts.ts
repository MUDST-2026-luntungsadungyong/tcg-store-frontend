import axios from 'axios';

import apiClient from '@/shared/api/client';
import { initMockStorage, storage } from '@/shared/mocks/storage';
import { ENV } from '@/shared/config/env';
import type { Product, ProductStatus } from '@/shared/types';

const SELLER_PRODUCTS_ENDPOINT = '/seller/products';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type SellerProduct = Product & {
  activeOrderCount?: number;
};

export type SellerProductInput = Omit<Product, 'id'>;

export type SellerProductQuery = {
  search?: string;
  game?: string;
  status?: ProductStatus;
  page?: number;
  size?: number;
};

export type SellerProductErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'ACTIVE_ORDER'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'REQUEST_FAILED';

export class SellerProductError extends Error {
  readonly code: SellerProductErrorCode;

  constructor(code: SellerProductErrorCode, message: string) {
    super(message);
    this.name = 'SellerProductError';
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeStatus(value: unknown): ProductStatus {
  if (value === 'SHOW' || value === 'HIDE') return value;
  throw new SellerProductError(
    'REQUEST_FAILED',
    'The server returned an invalid product status.',
  );
}

export function normalizeSellerProduct(value: unknown): SellerProduct {
  const record = asRecord(value);

  const id = record.id;
  const name = record.name;
  const game = record.game;
  const price = Number(record.price);
  const cost = Number(record.cost);
  const stock = Number(record.stock);

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    String(id).trim() === '' ||
    typeof name !== 'string' ||
    typeof game !== 'string' ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(cost) ||
    cost < 0 ||
    !Number.isSafeInteger(stock) ||
    stock < 0
  ) {
    throw new SellerProductError(
      'REQUEST_FAILED',
      'The server returned an invalid product. Please refresh the inventory.',
    );
  }

  const activeOrderCountRaw =
    record.activeOrderCount ?? record.activeOrders ?? record.active_order_count;
  const activeOrderCount = Number(activeOrderCountRaw);

  return {
    id: String(id),
    name,
    game,
    image: typeof record.image === 'string' ? record.image : '',
    price,
    cost,
    stock,
    status: normalizeStatus(record.status),
    condition:
      typeof record.condition === 'string' ? record.condition : undefined,
    set: typeof record.set === 'string' ? record.set : undefined,
    rarity: typeof record.rarity === 'string' ? record.rarity : undefined,
    activeOrderCount:
      Number.isSafeInteger(activeOrderCount) && activeOrderCount >= 0
        ? activeOrderCount
        : undefined,
  };
}

function unwrapProduct(value: unknown): SellerProduct {
  const outer = asRecord(value);
  const data = outer.data ?? value;
  const dataRecord = asRecord(data);
  return normalizeSellerProduct(dataRecord.product ?? data);
}

function unwrapProducts(value: unknown): SellerProduct[] {
  const outer = asRecord(value);
  const data = outer.data ?? value;
  const dataRecord = asRecord(data);
  const rows = Array.isArray(data)
    ? data
    : dataRecord.products ??
      dataRecord.items ??
      dataRecord.content ??
      outer.products ??
      outer.items ??
      outer.content;

  if (!Array.isArray(rows)) {
    throw new SellerProductError(
      'REQUEST_FAILED',
      'The server returned an invalid product list.',
    );
  }

  return rows.map(normalizeSellerProduct);
}

function responseMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const body = asRecord(error.response?.data);
  const message = body.message ?? asRecord(body.error).message;
  return typeof message === 'string' ? message : undefined;
}

export function toSellerProductError(error: unknown): SellerProductError {
  if (error instanceof SellerProductError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = asRecord(error.response?.data);
    const code = String(body.code ?? '').toUpperCase();
    const message = responseMessage(error);

    if (
      code === 'ACTIVE_ORDER' ||
      code === 'ACTIVE_ORDERS' ||
      code === 'PRODUCT_HAS_ACTIVE_ORDERS'
    ) {
      return new SellerProductError(
        'ACTIVE_ORDER',
        message ?? 'Cannot delete this product because it has an active order.',
      );
    }

    if (status === 400 || status === 422) {
      return new SellerProductError(
        'VALIDATION',
        message ?? 'Please check the product information and try again.',
      );
    }

    if (status === 401) {
      return new SellerProductError(
        'UNAUTHORIZED',
        message ?? 'Your session has expired. Please sign in again.',
      );
    }

    if (status === 403) {
      return new SellerProductError(
        'FORBIDDEN',
        message ?? 'You do not have permission to manage this product.',
      );
    }

    if (status === 404) {
      return new SellerProductError(
        'NOT_FOUND',
        message ?? 'This product no longer exists.',
      );
    }

    if (status === 409) {
      return new SellerProductError(
        'CONFLICT',
        message ?? 'This product conflicts with an existing listing.',
      );
    }

    return new SellerProductError(
      'REQUEST_FAILED',
      message ?? 'The server could not complete this request.',
    );
  }

  if (error instanceof Error) {
    return new SellerProductError('REQUEST_FAILED', error.message);
  }

  return new SellerProductError(
    'REQUEST_FAILED',
    'Something went wrong. Please try again.',
  );
}

function validateInput(input: SellerProductInput, file?: File | null): void {
  if (!input.name.trim()) {
    throw new SellerProductError('VALIDATION', 'Product name is required.');
  }
  if (!input.game.trim()) {
    throw new SellerProductError('VALIDATION', 'Game is required.');
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new SellerProductError('VALIDATION', 'Sell price must be 0 or more.');
  }
  if (!Number.isFinite(input.cost) || input.cost < 0) {
    throw new SellerProductError('VALIDATION', 'Cost must be 0 or more.');
  }
  if (!Number.isSafeInteger(input.stock) || input.stock < 0) {
    throw new SellerProductError(
      'VALIDATION',
      'Stock must be a whole number of 0 or more.',
    );
  }
  if (!input.image.trim() && !file) {
    throw new SellerProductError(
      'VALIDATION',
      'Add a product image or image URL.',
    );
  }
  if (file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new SellerProductError(
        'VALIDATION',
        'Use a JPG, PNG, or WebP image.',
      );
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new SellerProductError(
        'VALIDATION',
        'Image must be 5 MB or smaller.',
      );
    }
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read the selected image.'));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function toFormData(input: SellerProductInput, file: File): FormData {
  const formData = new FormData();
  formData.append('name', input.name);
  formData.append('game', input.game);
  formData.append('price', String(input.price));
  formData.append('cost', String(input.cost));
  formData.append('stock', String(input.stock));
  formData.append('status', input.status);
  formData.append('condition', input.condition ?? '');
  formData.append('set', input.set ?? '');
  formData.append('rarity', input.rarity ?? '');
  if (input.image) formData.append('imageUrl', input.image);
  formData.append('image', file, file.name);
  return formData;
}

function mockProducts(query: SellerProductQuery = {}): SellerProduct[] {
  initMockStorage();
  const orders = storage.getOrders();
  const normalizedSearch = query.search?.trim().toLowerCase();

  const products = storage
    .getProducts()
    .filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          product.name,
          product.game,
          product.condition,
          product.set,
          product.rarity,
          product.id,
          product.status,
          String(product.price),
          String(product.cost),
          String(product.stock),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );
      const matchesGame = !query.game || product.game === query.game;
      const matchesStatus = !query.status || product.status === query.status;
      return matchesSearch && matchesGame && matchesStatus;
    })
    .map((product) => ({
      ...product,
      activeOrderCount: orders.filter(
        (order) =>
          order.status === 'PENDING' &&
          order.items.some((item) => item.product.id === product.id),
      ).length,
    }));

  const hasPage = Number.isSafeInteger(query.page) && Number(query.page) >= 0;
  const hasSize = Number.isSafeInteger(query.size) && Number(query.size) > 0;
  if (!hasPage || !hasSize) return products;

  const start = Number(query.page) * Number(query.size);
  return products.slice(start, start + Number(query.size));
}

function mockActiveOrderCount(productId: string): number {
  return storage
    .getOrders()
    .filter(
      (order) =>
        order.status === 'PENDING' &&
        order.items.some((item) => item.product.id === productId),
    ).length;
}

export const sellerProductsApi = {
  async getProducts(query: SellerProductQuery = {}): Promise<SellerProduct[]> {
    if (ENV.ENABLE_MOCK_API) {
      return mockProducts(query);
    }

    try {
      const response = await apiClient.get(SELLER_PRODUCTS_ENDPOINT, {
        params: {
          search: query.search?.trim() || undefined,
          game: query.game || undefined,
          status: query.status || undefined,
          page:
            Number.isSafeInteger(query.page) && Number(query.page) >= 0
              ? query.page
              : undefined,
          size:
            Number.isSafeInteger(query.size) && Number(query.size) > 0
              ? query.size
              : undefined,
        },
      });
      return unwrapProducts(response.data);
    } catch (error) {
      throw toSellerProductError(error);
    }
  },

  async createProduct(
    input: SellerProductInput,
    file?: File | null,
  ): Promise<SellerProduct> {
    validateInput(input, file);

    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const image = file ? await fileToDataUrl(file) : input.image;
      const product: Product = {
        ...input,
        image,
        id: `prd-${crypto.randomUUID()}`,
      };
      storage.setProducts([product, ...storage.getProducts()]);
      return { ...product, activeOrderCount: 0 };
    }

    try {
      const response = file
        ? await apiClient.post(
            SELLER_PRODUCTS_ENDPOINT,
            toFormData(input, file),
            { headers: { 'Content-Type': 'multipart/form-data' } },
          )
        : await apiClient.post(SELLER_PRODUCTS_ENDPOINT, input);

      return unwrapProduct(response.data);
    } catch (error) {
      throw toSellerProductError(error);
    }
  },

  async updateProduct(
    id: string,
    input: SellerProductInput,
    file?: File | null,
  ): Promise<SellerProduct> {
    validateInput(input, file);

    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const products = storage.getProducts();
      const existing = products.find((product) => product.id === id);
      if (!existing) {
        throw new SellerProductError('NOT_FOUND', 'This product no longer exists.');
      }

      const image = file ? await fileToDataUrl(file) : input.image;
      const updated: Product = { ...existing, ...input, image, id };
      storage.setProducts(
        products.map((product) => (product.id === id ? updated : product)),
      );
      return {
        ...updated,
        activeOrderCount: mockActiveOrderCount(id),
      };
    }

    try {
      const response = file
        ? await apiClient.put(
            `${SELLER_PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}`,
            toFormData(input, file),
            { headers: { 'Content-Type': 'multipart/form-data' } },
          )
        : await apiClient.put(
            `${SELLER_PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}`,
            input,
          );

      if (response.status === 204 || response.data == null || response.data === '') {
        return { ...input, id };
      }

      return unwrapProduct(response.data);
    } catch (error) {
      throw toSellerProductError(error);
    }
  },

  async setStatus(id: string, status: ProductStatus): Promise<void> {
    if (status !== 'SHOW' && status !== 'HIDE') {
      throw new SellerProductError('VALIDATION', 'Select Show or Hide.');
    }

    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const products = storage.getProducts();
      const existing = products.find((product) => product.id === id);
      if (!existing) {
        throw new SellerProductError('NOT_FOUND', 'This product no longer exists.');
      }
      storage.setProducts(
        products.map((product) =>
          product.id === id ? { ...product, status } : product,
        ),
      );
      return;
    }

    try {
      await apiClient.patch(
        `${SELLER_PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}/status`,
        { status },
      );
    } catch (error) {
      throw toSellerProductError(error);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const products = storage.getProducts();
      const existing = products.find((product) => product.id === id);
      if (!existing) {
        throw new SellerProductError('NOT_FOUND', 'This product no longer exists.');
      }

      if (mockActiveOrderCount(id) > 0) {
        throw new SellerProductError(
          'ACTIVE_ORDER',
          'Cannot delete this product because it has an active order.',
        );
      }

      if (existing.status !== 'HIDE') {
        throw new SellerProductError(
          'VALIDATION',
          'Hide this product before deleting it.',
        );
      }

      storage.setProducts(products.filter((product) => product.id !== id));
      return;
    }

    try {
      await apiClient.delete(
        `${SELLER_PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}`,
      );
    } catch (error) {
      const failure = toSellerProductError(error);
      if (failure.code === 'CONFLICT') {
        throw new SellerProductError('ACTIVE_ORDER', failure.message);
      }
      throw failure;
    }
  },
};
