import { create } from 'zustand';

import {
  SellerProductError,
  sellerProductsApi,
  toSellerProductError,
  type SellerProduct,
  type SellerProductInput,
} from '@/features/seller/api/sellerProducts';
import type { ProductStatus } from '@/shared/types';

export type SellerInventoryView = 'grid' | 'table';
export type SellerStatusFilter = 'ALL' | ProductStatus;

export interface SellerInventoryState {
  products: SellerProduct[];
  isLoading: boolean;
  isSaving: boolean;
  pendingIds: string[];
  error: string | null;
  searchQuery: string;
  gameFilter: string;
  statusFilter: SellerStatusFilter;
  viewMode: SellerInventoryView;
  currentPage: number;
  pageSize: number;

  fetchProducts: () => Promise<void>;
  saveProduct: (
    input: SellerProductInput,
    id?: string,
    file?: File | null,
  ) => Promise<SellerProduct>;
  setProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  clearError: () => void;
  setSearchQuery: (query: string) => void;
  setGameFilter: (game: string) => void;
  setStatusFilter: (status: SellerStatusFilter) => void;
  setViewMode: (viewMode: SellerInventoryView) => void;
  setCurrentPage: (page: number) => void;
}

export const useSellerInventoryStore = create<SellerInventoryState>(
  (set, get) => ({
    products: [],
    isLoading: false,
    isSaving: false,
    pendingIds: [],
    error: null,
    searchQuery: '',
    gameFilter: 'ALL',
    statusFilter: 'ALL',
    viewMode: 'table',
    currentPage: 1,
    pageSize: 8,

    clearError: () => set({ error: null }),
    setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
    setGameFilter: (gameFilter) => set({ gameFilter, currentPage: 1 }),
    setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),
    setViewMode: (viewMode) => set({ viewMode, currentPage: 1 }),
    setCurrentPage: (currentPage) =>
      set({ currentPage: Math.max(1, Math.floor(currentPage)) }),

    fetchProducts: async () => {
      set({ isLoading: true, error: null });

      try {
        const products = await sellerProductsApi.getProducts();
        set({ products });
      } catch (error) {
        const failure = toSellerProductError(error);
        set({ error: failure.message });
        throw failure;
      } finally {
        set({ isLoading: false });
      }
    },

    saveProduct: async (input, id, file) => {
      if (get().isSaving || (id && get().pendingIds.includes(id))) {
        throw new Error('A product change is already being saved.');
      }

      set((state) => ({
        isSaving: true,
        error: null,
        pendingIds: id
          ? [...state.pendingIds.filter((pendingId) => pendingId !== id), id]
          : state.pendingIds,
      }));

      try {
        const savedProduct = id
          ? await sellerProductsApi.updateProduct(id, input, file)
          : await sellerProductsApi.createProduct(input, file);

        set((state) => ({
          products: id
            ? state.products.map((product) =>
                product.id === id ? savedProduct : product,
              )
            : [savedProduct, ...state.products],
          currentPage: id ? state.currentPage : 1,
        }));

        return savedProduct;
      } catch (error) {
        const failure = toSellerProductError(error);
        set({ error: failure.message });
        throw failure;
      } finally {
        set((state) => ({
          isSaving: false,
          pendingIds: id
            ? state.pendingIds.filter((pendingId) => pendingId !== id)
            : state.pendingIds,
        }));
      }
    },

    setProductStatus: async (id, status) => {
      if (get().pendingIds.includes(id)) return;

      const previous = get().products.find((product) => product.id === id);
      if (!previous) {
        throw new Error('This product no longer exists.');
      }

      set((state) => ({
        error: null,
        pendingIds: [...state.pendingIds, id],
        products: state.products.map((product) =>
          product.id === id ? { ...product, status } : product,
        ),
      }));

      try {
        await sellerProductsApi.setStatus(id, status);
      } catch (error) {
        const failure = toSellerProductError(error);
        set((state) => ({
          error: failure.message,
          products: state.products.map((product) =>
            product.id === id
              ? { ...product, status: previous.status }
              : product,
          ),
        }));
        throw failure;
      } finally {
        set((state) => ({
          pendingIds: state.pendingIds.filter(
            (pendingId) => pendingId !== id,
          ),
        }));
      }
    },

    deleteProduct: async (id) => {
      if (get().pendingIds.includes(id)) return;

      const product = get().products.find((candidate) => candidate.id === id);
      if (!product) {
        throw new SellerProductError('NOT_FOUND', 'This product no longer exists.');
      }
      if (product.status !== 'HIDE') {
        throw new SellerProductError(
          'VALIDATION',
          'Hide this product before deleting it.',
        );
      }

      set((state) => ({
        error: null,
        pendingIds: [...state.pendingIds, id],
      }));

      try {
        await sellerProductsApi.deleteProduct(id);
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }));
      } catch (error) {
        const failure = toSellerProductError(error);
        set({ error: failure.message });
        throw failure;
      } finally {
        set((state) => ({
          pendingIds: state.pendingIds.filter(
            (pendingId) => pendingId !== id,
          ),
        }));
      }
    },
  }),
);
