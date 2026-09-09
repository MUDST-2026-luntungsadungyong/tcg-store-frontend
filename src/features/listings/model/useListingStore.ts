import { create } from 'zustand';

import {
  ListingError,
  listingsApi,
  toListingError,
  type ManagedListing,
  type ManagedListingInput,
} from '@/features/listings/api/listings';
import type { ListingVisibility } from '@/entities/card/model/types';

export type ListingView = 'grid' | 'table';
export type ListingVisibilityFilter = 'ALL' | ListingVisibility;

export interface ListingStoreState {
  listings: ManagedListing[];
  isLoading: boolean;
  isSaving: boolean;
  pendingIds: string[];
  error: string | null;
  searchQuery: string;
  gameFilter: string;
  statusFilter: ListingVisibilityFilter;
  viewMode: ListingView;
  currentPage: number;
  pageSize: number;

  fetchListings: () => Promise<void>;
  saveListing: (
    input: ManagedListingInput,
    id?: string,
    file?: File | null,
  ) => Promise<ManagedListing>;
  setListingVisibility: (id: string, status: ListingVisibility) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  clearError: () => void;
  setSearchQuery: (query: string) => void;
  setGameFilter: (game: string) => void;
  setVisibilityFilter: (status: ListingVisibilityFilter) => void;
  setViewMode: (viewMode: ListingView) => void;
  setCurrentPage: (page: number) => void;
}

export const useListingStore = create<ListingStoreState>(
  (set, get) => ({
    listings: [],
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
    setVisibilityFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),
    setViewMode: (viewMode) => set({ viewMode, currentPage: 1 }),
    setCurrentPage: (currentPage) =>
      set({ currentPage: Math.max(1, Math.floor(currentPage)) }),

    fetchListings: async () => {
      set({ isLoading: true, error: null });

      try {
        const listings = await listingsApi.getListings();
        set({ listings });
      } catch (error) {
        const failure = toListingError(error);
        set({ error: failure.message });
        throw failure;
      } finally {
        set({ isLoading: false });
      }
    },

    saveListing: async (input, id, file) => {
      if (get().isSaving || (id && get().pendingIds.includes(id))) {
        throw new Error('A listing change is already being saved.');
      }

      set((state) => ({
        isSaving: true,
        error: null,
        pendingIds: id
          ? [...state.pendingIds.filter((pendingId) => pendingId !== id), id]
          : state.pendingIds,
      }));

      try {
        const savedListing = id
          ? await listingsApi.updateListing(id, input, file)
          : await listingsApi.createListing(input, file);

        set((state) => ({
          listings: id
            ? state.listings.map((listing) =>
                listing.id === id ? savedListing : listing,
              )
            : [savedListing, ...state.listings],
          currentPage: id ? state.currentPage : 1,
        }));

        return savedListing;
      } catch (error) {
        const failure = toListingError(error);
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

    setListingVisibility: async (id, status) => {
      if (get().pendingIds.includes(id)) return;

      const previous = get().listings.find((listing) => listing.id === id);
      if (!previous) {
        throw new Error('This listing no longer exists.');
      }

      set((state) => ({
        error: null,
        pendingIds: [...state.pendingIds, id],
        listings: state.listings.map((listing) =>
          listing.id === id ? { ...listing, status } : listing,
        ),
      }));

      try {
        await listingsApi.setVisibility(id, status);
      } catch (error) {
        const failure = toListingError(error);
        set((state) => ({
          error: failure.message,
          listings: state.listings.map((listing) =>
            listing.id === id
              ? { ...listing, status: previous.status }
              : listing,
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

    deleteListing: async (id) => {
      if (get().pendingIds.includes(id)) return;

      const listing = get().listings.find((candidate) => candidate.id === id);
      if (!listing) {
        throw new ListingError('NOT_FOUND', 'This listing no longer exists.');
      }
      if (listing.status !== 'HIDE') {
        throw new ListingError(
          'VALIDATION',
          'Hide this listing before deleting it.',
        );
      }

      set((state) => ({
        error: null,
        pendingIds: [...state.pendingIds, id],
      }));

      try {
        await listingsApi.deleteListing(id);
        set((state) => ({
          listings: state.listings.filter((listing) => listing.id !== id),
        }));
      } catch (error) {
        const failure = toListingError(error);
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
