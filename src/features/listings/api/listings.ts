import axios from 'axios';

import apiClient from '@/shared/api/client';
import { initMockStorage, storage } from '@/infrastructure/mock-db/storage';
import { ENV } from '@/shared/config/env';
import type { CardListing, ListingVisibility } from '@/entities/card/model/types';

const LISTINGS_ENDPOINT = '/seller/listings';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type ManagedListing = CardListing & {
  activeReservationCount?: number;
};

export type ManagedListingInput = Omit<CardListing, 'id' | 'sellerId'>;

export type ManagedListingQuery = {
  search?: string;
  game?: string;
  status?: ListingVisibility;
  page?: number;
  size?: number;
};

export type ListingErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'ACTIVE_RESERVATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'REQUEST_FAILED';

export class ListingError extends Error {
  readonly code: ListingErrorCode;

  constructor(code: ListingErrorCode, message: string) {
    super(message);
    this.name = 'ListingError';
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeStatus(value: unknown): ListingVisibility {
  if (value === 'SHOW' || value === 'HIDE') return value;
  throw new ListingError(
    'REQUEST_FAILED',
    'The server returned an invalid listing status.',
  );
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === 'string' ? record[key] : undefined;
}

function optionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  if (record[key] === null || record[key] === undefined || record[key] === '') {
    return undefined;
  }
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : undefined;
}

export function normalizeManagedListing(value: unknown): ManagedListing {
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
    throw new ListingError(
      'REQUEST_FAILED',
      'The server returned an invalid listing. Please refresh the inventory.',
    );
  }

  const activeReservationCountRaw =
    record.activeReservationCount ??
    record.activeReservations ??
    record.active_reservation_count;
  const activeReservationCount = Number(activeReservationCountRaw);

  return {
    id: String(id),
    sellerId:
      typeof record.sellerId === 'string'
        ? record.sellerId
        : String(record.ownerId ?? ''),
    name,
    game,
    image: typeof record.image === 'string' ? record.image : '',
    price,
    cost,
    stock,
    status: normalizeStatus(record.status),
    condition:
      typeof record.condition === 'string' ? record.condition : undefined,
    language: optionalString(record, 'language'),
    set: typeof record.set === 'string' ? record.set : undefined,
    rarity: typeof record.rarity === 'string' ? record.rarity : undefined,
    cardId: optionalString(record, 'cardId'),
    cardNumber: optionalString(record, 'cardNumber'),
    supertype: optionalString(record, 'supertype'),
    subtypes: optionalString(record, 'subtypes'),
    hp: optionalString(record, 'hp'),
    types: optionalString(record, 'types'),
    artist: optionalString(record, 'artist'),
    imageSmall: optionalString(record, 'imageSmall'),
    imageLarge: optionalString(record, 'imageLarge'),
    marketPrice: optionalNumber(record, 'marketPrice'),
    activeReservationCount:
      Number.isSafeInteger(activeReservationCount) && activeReservationCount >= 0
        ? activeReservationCount
        : undefined,
  };
}

function unwrapListing(value: unknown): ManagedListing {
  const outer = asRecord(value);
  const data = outer.data ?? value;
  const dataRecord = asRecord(data);
  return normalizeManagedListing(dataRecord.listing ?? data);
}

function unwrapListings(value: unknown): ManagedListing[] {
  const outer = asRecord(value);
  const data = outer.data ?? value;
  const dataRecord = asRecord(data);
  const rows = Array.isArray(data)
    ? data
    : dataRecord.listings ??
      dataRecord.items ??
      dataRecord.content ??
      outer.listings ??
      outer.items ??
      outer.content;

  if (!Array.isArray(rows)) {
    throw new ListingError(
      'REQUEST_FAILED',
      'The server returned an invalid listing list.',
    );
  }

  return rows.map(normalizeManagedListing);
}

function responseMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const body = asRecord(error.response?.data);
  const message = body.message ?? asRecord(body.error).message;
  return typeof message === 'string' ? message : undefined;
}

export function toListingError(error: unknown): ListingError {
  if (error instanceof ListingError) return error;

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
      return new ListingError(
        'ACTIVE_RESERVATION',
        message ?? 'Cannot delete this listing because it has an active reservation.',
      );
    }

    if (status === 400 || status === 422) {
      return new ListingError(
        'VALIDATION',
        message ?? 'Please check the listing information and try again.',
      );
    }

    if (status === 401) {
      return new ListingError(
        'UNAUTHORIZED',
        message ?? 'Your session has expired. Please sign in again.',
      );
    }

    if (status === 403) {
      return new ListingError(
        'FORBIDDEN',
        message ?? 'You do not have permission to manage this listing.',
      );
    }

    if (status === 404) {
      return new ListingError(
        'NOT_FOUND',
        message ?? 'This listing no longer exists.',
      );
    }

    if (status === 409) {
      return new ListingError(
        'CONFLICT',
        message ?? 'This listing conflicts with an existing listing.',
      );
    }

    return new ListingError(
      'REQUEST_FAILED',
      message ?? 'The server could not complete this request.',
    );
  }

  if (error instanceof Error) {
    return new ListingError('REQUEST_FAILED', error.message);
  }

  return new ListingError(
    'REQUEST_FAILED',
    'Something went wrong. Please try again.',
  );
}

function validateInput(input: ManagedListingInput, file?: File | null): void {
  if (!input.name.trim()) {
    throw new ListingError('VALIDATION', 'Listing name is required.');
  }
  if (!input.game.trim()) {
    throw new ListingError('VALIDATION', 'Game is required.');
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new ListingError('VALIDATION', 'Sell price must be 0 or more.');
  }
  if (!Number.isFinite(input.cost) || input.cost < 0) {
    throw new ListingError('VALIDATION', 'Cost must be 0 or more.');
  }
  if (!Number.isSafeInteger(input.stock) || input.stock < 0) {
    throw new ListingError(
      'VALIDATION',
      'Stock must be a whole number of 0 or more.',
    );
  }
  if (!input.image.trim() && !file) {
    throw new ListingError(
      'VALIDATION',
      'Add a listing image or image URL.',
    );
  }
  if (file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new ListingError(
        'VALIDATION',
        'Use a JPG, PNG, or WebP image.',
      );
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new ListingError(
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

function toFormData(input: ManagedListingInput, file: File): FormData {
  const formData = new FormData();
  if (input.cardId) formData.append('cardId', input.cardId);
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

function mockListings(query: ManagedListingQuery = {}): ManagedListing[] {
  initMockStorage();
  const orders = storage.getReservations();
  const normalizedSearch = query.search?.trim().toLowerCase();

  const listings = storage
    .getListings()
    .filter((listing) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          listing.name,
          listing.game,
          listing.condition,
          listing.set,
          listing.rarity,
          listing.id,
          listing.status,
          String(listing.price),
          String(listing.cost),
          String(listing.stock),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );
      const matchesGame = !query.game || listing.game === query.game;
      const matchesStatus = !query.status || listing.status === query.status;
      return matchesSearch && matchesGame && matchesStatus;
    })
    .map((listing) => ({
      ...listing,
      activeReservationCount: orders.filter(
        (order) =>
          order.status !== 'SENT' &&
          order.status !== 'CANCELLED' &&
          order.items.some((item) => item.listing.id === listing.id),
      ).length,
    }));

  const hasPage = Number.isSafeInteger(query.page) && Number(query.page) >= 0;
  const hasSize = Number.isSafeInteger(query.size) && Number(query.size) > 0;
  if (!hasPage || !hasSize) return listings;

  const start = Number(query.page) * Number(query.size);
  return listings.slice(start, start + Number(query.size));
}

function mockActiveReservationCount(listingId: string): number {
  return storage
    .getReservations()
    .filter(
      (order) =>
        order.status !== 'SENT' &&
        order.status !== 'CANCELLED' &&
        order.items.some((item) => item.listing.id === listingId),
    ).length;
}

export const listingsApi = {
  async getListings(query: ManagedListingQuery = {}): Promise<ManagedListing[]> {
    if (ENV.ENABLE_MOCK_API) {
      return mockListings(query);
    }

    try {
      const response = await apiClient.get(LISTINGS_ENDPOINT, {
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
      return unwrapListings(response.data);
    } catch (error) {
      throw toListingError(error);
    }
  },

  async createListing(
    input: ManagedListingInput,
    file?: File | null,
  ): Promise<ManagedListing> {
    validateInput(input, file);

    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const image = file ? await fileToDataUrl(file) : input.image;
      const listing: CardListing = {
        ...input,
        image,
        id: `prd-${crypto.randomUUID()}`,
        sellerId: 'usr-3',
      };
      storage.setListings([listing, ...storage.getListings()]);
      return { ...listing, activeReservationCount: 0 };
    }

    try {
      const response = file
        ? await apiClient.post(
            LISTINGS_ENDPOINT,
            toFormData(input, file),
            { headers: { 'Content-Type': 'multipart/form-data' } },
          )
        : await apiClient.post(LISTINGS_ENDPOINT, input);

      return unwrapListing(response.data);
    } catch (error) {
      throw toListingError(error);
    }
  },

  async updateListing(
    id: string,
    input: ManagedListingInput,
    file?: File | null,
  ): Promise<ManagedListing> {
    validateInput(input, file);

    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const listings = storage.getListings();
      const existing = listings.find((listing) => listing.id === id);
      if (!existing) {
        throw new ListingError('NOT_FOUND', 'This listing no longer exists.');
      }

      const image = file ? await fileToDataUrl(file) : input.image;
      const updated: CardListing = { ...existing, ...input, image, id };
      storage.setListings(
        listings.map((listing) => (listing.id === id ? updated : listing)),
      );
      return {
        ...updated,
        activeReservationCount: mockActiveReservationCount(id),
      };
    }

    try {
      const response = file
        ? await apiClient.put(
            `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}`,
            toFormData(input, file),
            { headers: { 'Content-Type': 'multipart/form-data' } },
          )
        : await apiClient.put(
            `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}`,
            input,
          );

      if (response.status === 204 || response.data == null || response.data === '') {
        throw new ListingError(
          'REQUEST_FAILED',
          'The listing was saved, but the server did not return its latest data. Refresh and try again.',
        );
      }

      return unwrapListing(response.data);
    } catch (error) {
      throw toListingError(error);
    }
  },

  async setVisibility(id: string, status: ListingVisibility): Promise<void> {
    if (status !== 'SHOW' && status !== 'HIDE') {
      throw new ListingError('VALIDATION', 'Select Show or Hide.');
    }

    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const listings = storage.getListings();
      const existing = listings.find((listing) => listing.id === id);
      if (!existing) {
        throw new ListingError('NOT_FOUND', 'This listing no longer exists.');
      }
      storage.setListings(
        listings.map((listing) =>
          listing.id === id ? { ...listing, status } : listing,
        ),
      );
      return;
    }

    try {
      await apiClient.patch(
        `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}/visibility`,
        { status },
      );
    } catch (error) {
      throw toListingError(error);
    }
  },

  async deleteListing(id: string): Promise<void> {
    if (ENV.ENABLE_MOCK_API) {
      initMockStorage();
      const listings = storage.getListings();
      const existing = listings.find((listing) => listing.id === id);
      if (!existing) {
        throw new ListingError('NOT_FOUND', 'This listing no longer exists.');
      }

      if (mockActiveReservationCount(id) > 0) {
        throw new ListingError(
          'ACTIVE_RESERVATION',
          'Cannot delete this listing because it has an active reservation.',
        );
      }

      if (existing.status !== 'HIDE') {
        throw new ListingError(
          'VALIDATION',
          'Hide this listing before deleting it.',
        );
      }

      storage.setListings(listings.filter((listing) => listing.id !== id));
      return;
    }

    try {
      await apiClient.delete(
        `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}`,
      );
    } catch (error) {
      const failure = toListingError(error);
      if (failure.code === 'CONFLICT') {
        throw new ListingError('ACTIVE_RESERVATION', failure.message);
      }
      throw failure;
    }
  },
};
