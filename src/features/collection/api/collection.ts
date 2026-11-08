import { getStoredAccessToken } from '@/shared/api/authStorage';
import { ENV } from '@/shared/config/env';
import { storage } from '@/infrastructure/mock-db/storage';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import type { CatalogCard } from '@/features/discovery/api/catalog';
import apiClient from '@/shared/api/client';

export interface CollectionPageMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CollectionResponse {
  items: CollectionEntryResponse[];
  page: CollectionPageMetadata;
  privacy?: 'PUBLIC' | 'PRIVATE';
}

export interface CollectionPrivacyResponse {
  privacy: 'PUBLIC' | 'PRIVATE';
}

export interface CollectionEntryResponse {
  id: string;
  ownerId: string;
  quantity?: number;
  cardId?: string;
  cardName?: string;
  game?: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
  condition?: string;
  imageUrl?: string;
  sourceOrderId?: string;
  createdAt?: string;
  acquiredAt?: string;
  listing?: Partial<CardListing>;
}

export interface PublicCollectionOwner {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  rareCardCount?: number;
  distinctRareCardCount?: number;
  role?: string;
  sellerStatus?: string;
  collectionPrivacy?: 'PUBLIC' | 'PRIVATE';
  isSeller?: boolean;
}


export interface PublicRareCardHighlight {
  cardId: string;
  name: string;
  imageUrl: string;
  rarity: string;
  quantity: number;
}

export interface PublicCollectionSummary {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: string;
  sellerStatus?: string;
  isSeller?: boolean;
  totalCardsCount: number;
  rareCardCount: number;
  distinctRareCardCount: number;
  highlights: PublicRareCardHighlight[];
}

export interface PublicCollectionsResponse {
  items: PublicCollectionSummary[];
  page: CollectionPageMetadata;
}

export interface GetPublicCollectionsParams {
  search?: string;
  role?: 'ALL' | 'SELLER' | 'BUYER';
  sort?: 'RARE_DESC' | 'TOTAL_DESC' | 'NAME_ASC';
  page?: number;
  size?: number;
}

export interface PublicCollectionResponse {
  owner?: PublicCollectionOwner;
  ownerId?: string;
  displayName?: string;
  avatarUrl?: string | null;
  items?: CollectionEntryResponse[];
  page?: CollectionPageMetadata;
}

function normalizeCollectionEntry(value: CollectionEntryResponse): CollectionEntry {
  const listing = value.listing ?? {};
  const listingId = String(listing.id ?? value.cardId ?? value.id);
  return {
    id: String(value.id),
    ownerId: String(value.ownerId),
    listing: {
      id: listingId,
      sellerId: String(listing.sellerId ?? ''),
      name: String(listing.name ?? value.cardName ?? listingId),
      game: String(listing.game ?? value.game ?? ''),
      image: String(listing.image ?? value.imageUrl ?? ''),
      price: Number(listing.price ?? 0),
      cost: Number(listing.cost ?? listing.price ?? 0),
      stock: Number(listing.stock ?? 0),
      status: listing.status === 'HIDE' ? 'HIDE' : 'SHOW',
      condition: listing.condition ?? value.condition,
      set: listing.set ?? value.setName,
      rarity: listing.rarity ?? value.rarity,
      cardNumber: listing.cardNumber ?? value.cardNumber,
    },
    quantity: Number(value.quantity ?? 0),
    sourceOrderId: String(value.sourceOrderId ?? ''),
    acquiredAt: String(value.acquiredAt ?? value.createdAt ?? new Date(0).toISOString()),
  };
}

function getCurrentUserId(): string {
  try {
    const raw = typeof window !== 'undefined'
      ? sessionStorage.getItem('tcg_auth_storage') ?? localStorage.getItem('tcg_auth_storage')
      : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.user?.id) {
        return String(parsed.state.user.id);
      }
    }
  } catch {
    // ignore
  }
  const token = getStoredAccessToken();
  if (token?.includes('admin')) return 'usr-2';
  if (token?.includes('seller')) return 'usr-3';
  return 'usr-1';
}

export const collectionApi = {
  getMyCollection: async (): Promise<CollectionEntry[]> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const userId = getCurrentUserId();
      return storage.getCollection().filter((item) => item.ownerId === userId);
    }
    const response = await apiClient.get<CollectionResponse>('/collection');
    return response.data.items.map(normalizeCollectionEntry);
  },

  getCollectionPrivacy: async (): Promise<'PUBLIC' | 'PRIVATE'> => {
    if (ENV.ENABLE_MOCK_API) {
      const userId = getCurrentUserId();
      const stored = localStorage.getItem(`mythix_collection_privacy_${userId}`)
        || localStorage.getItem('mythix_collection_privacy_current')
        || (userId === 'usr-1' ? localStorage.getItem('mythix_collection_privacy_usr-1') : null);
      return (stored as 'PUBLIC' | 'PRIVATE') || 'PUBLIC';
    }
    const response = await apiClient.get<CollectionPrivacyResponse>('/collection/privacy');
    return response.data.privacy || 'PUBLIC';
  },

  updateCollectionPrivacy: async (privacy: 'PUBLIC' | 'PRIVATE'): Promise<'PUBLIC' | 'PRIVATE'> => {
    if (ENV.ENABLE_MOCK_API) {
      const userId = getCurrentUserId();
      localStorage.setItem(`mythix_collection_privacy_${userId}`, privacy);
      localStorage.setItem('mythix_collection_privacy_current', privacy);
      if (userId === 'usr-1') {
        localStorage.setItem('mythix_collection_privacy_usr-1', privacy);
      }
      return privacy;
    }
    const response = await apiClient.put<CollectionPrivacyResponse>('/collection/privacy', { privacy });
    return response.data.privacy;
  },

  addToCollection: async (listing: CardListing): Promise<CollectionEntry> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const token = getStoredAccessToken();
      const userId = token?.includes('admin') ? 'usr-2' : token?.includes('seller') ? 'usr-3' : 'usr-1';
      const all = storage.getCollection();
      const existing = all.find((item) => item.ownerId === userId && item.listing.id === listing.id);
      if (existing) {
        existing.quantity += 1;
        storage.setCollection(all);
        return existing;
      }
      const newEntry: CollectionEntry = {
        id: `col-${Date.now()}`,
        ownerId: userId,
        listing,
        quantity: 1,
        sourceOrderId: `ord-direct-${Date.now()}`,
        acquiredAt: new Date().toISOString(),
      };
      storage.setCollection([newEntry, ...all]);
      return newEntry;
    }
    const response = await apiClient.post<CollectionEntry>('/collection', { listingId: listing.id });
    return response.data;
  },

  addCatalogCardToCollection: async (
    card: CatalogCard,
    quantity = 1,
  ): Promise<CollectionEntry> => {
    // --- QA TEST SETTING FOR CASE 9 ---
    if (localStorage.getItem('DEV_SIMULATE_API_ERROR') === 'true') {
      throw new Error('500 Internal Server Error: Database connection lost while saving.');
    }
    // ----------------------------------

    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const token = getStoredAccessToken();
      const userId = token?.includes('admin') ? 'usr-2' : token?.includes('seller') ? 'usr-3' : 'usr-1';
      const all = storage.getCollection();
      const existing = all.find((item) => item.ownerId === userId && item.listing.id === card.id);
      if (existing) {
        existing.quantity += quantity;
        storage.setCollection(all);
        return existing;
      }
      const listing: CardListing = {
        id: card.id,
        sellerId: '',
        name: card.name,
        game: card.game ?? 'Pokemon',
        image: card.imageSmall ?? card.imageLarge ?? '',
        price: card.marketPrice ?? 0,
        cost: 0,
        stock: 0,
        status: 'SHOW',
        set: card.setName,
        rarity: card.rarity,
        cardNumber: card.cardNumber,
      };
      const newEntry: CollectionEntry = {
        id: `col-${Date.now()}`,
        ownerId: userId,
        listing,
        quantity,
        sourceOrderId: `ord-direct-${Date.now()}`,
        acquiredAt: new Date().toISOString(),
      };
      storage.setCollection([newEntry, ...all]);
      return newEntry;
    }
    const response = await apiClient.post<CollectionEntry>('/collection', {
      cardId: card.id,
      quantity,
    });
    return response.data;
  },

  removeFromCollection: async (collectionEntryId: string): Promise<void> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const all = storage.getCollection();
      storage.setCollection(all.filter((item) => item.id !== collectionEntryId && item.listing.id !== collectionEntryId));
      return;
    }
    await apiClient.delete(`/collection/${collectionEntryId}`);
  },

  getPublicCollection: async (userId: string): Promise<{
    owner: PublicCollectionOwner;
    items: CollectionEntry[];
    page?: CollectionPageMetadata;
  }> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const allUsers = storage.getUsers();
      const targetUser = allUsers.find(
        (u) => String(u.id) === String(userId) || (userId === 'usr-1' && u.email === 'ash@mythix.com')
      );
      const hasCollection = storage.getCollection().some((item) => String(item.ownerId) === String(userId));

      if (!targetUser && !hasCollection && userId !== 'usr-1' && userId !== 'usr-2' && userId !== 'usr-3' && userId !== 'usr-4') {
        const notFoundError = new Error('Public collection not found.');
        (notFoundError as any).status = 404;
        (notFoundError as any).code = 'PUBLIC_COLLECTION_NOT_FOUND';
        throw notFoundError;
      }

      const currentUserId = getCurrentUserId();
      const isCurrentUser = userId === currentUserId || (userId === 'usr-1' && currentUserId === 'usr-1');
      const privacy = (
        localStorage.getItem(`mythix_collection_privacy_${userId}`) ||
        (isCurrentUser ? localStorage.getItem('mythix_collection_privacy_current') : null) ||
        (userId === 'usr-1' ? localStorage.getItem('mythix_collection_privacy_usr-1') : null) ||
        'PUBLIC'
      ) as 'PUBLIC' | 'PRIVATE';

      if (privacy === 'PRIVATE') {
        const error = new Error('This collection is private.');
        (error as any).status = 403;
        (error as any).code = 'COLLECTION_PRIVATE';
        throw error;
      }

      return {
        owner: {
          userId,
          displayName: targetUser?.name || (userId === 'usr-4' ? 'Ash Ketchum' : 'Test Buyer'),
          avatarUrl: null,
          rareCardCount: 10,
          distinctRareCardCount: 5,
          collectionPrivacy: privacy,
          isSeller: targetUser?.isSeller || userId === 'usr-3',
        },
        items: storage.getCollection().filter((item) => String(item.ownerId) === String(userId)) || [],
      };
    }

    const response = await apiClient.get<PublicCollectionResponse>(`/collections/${encodeURIComponent(userId)}`);
    const data = response.data ?? {};
    const owner = data.owner ?? {
      userId: String(data.ownerId ?? userId),
      displayName: String(data.displayName ?? 'Public collection'),
      avatarUrl: data.avatarUrl ?? null,
    };

    const isSeller = owner.sellerStatus === 'APPROVED' || owner.role === 'SELLER';

    return {
      owner: {
        userId: String(owner.userId ?? userId),
        displayName: String(owner.displayName ?? 'Public collection'),
        avatarUrl: owner.avatarUrl ?? null,
        rareCardCount: owner.rareCardCount,
        distinctRareCardCount: owner.distinctRareCardCount,
        role: owner.role,
        sellerStatus: owner.sellerStatus,
        collectionPrivacy: owner.collectionPrivacy ?? 'PUBLIC',
        isSeller,
      },
      items: (data.items ?? []).map(normalizeCollectionEntry),
      page: data.page,
    };
  },

  getPublicCollections: async (params: GetPublicCollectionsParams = {}): Promise<PublicCollectionsResponse> => {
    const {
      search = '',
      role = 'ALL',
      sort = 'RARE_DESC',
      page = 0,
      size = 12,
    } = params;

    if (ENV.ENABLE_MOCK_API) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const allUsers = storage.getUsers();
      const allCollectionItems = storage.getCollection();

      // Only include users who are PUBLIC
      const publicUsers = allUsers.filter((u) => {
        const privacy = localStorage.getItem(`mythix_collection_privacy_${u.id}`) ||
          (u.id === 'usr-1' ? localStorage.getItem('mythix_collection_privacy_usr-1') : null);
        return privacy !== 'PRIVATE';
      });

      const summaries: PublicCollectionSummary[] = publicUsers.map((user) => {
        const userCards = allCollectionItems.filter((c) => String(c.ownerId) === String(user.id));
        const totalCardsCount = userCards.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
        
        const rareCards = userCards.filter((c) => {
          const rarity = (c.listing?.rarity || '').toLowerCase();
          return rarity.includes('rare') || rarity.includes('promo') || rarity.includes('holo');
        });
        const rareCardCount = rareCards.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
        const distinctRareCardCount = new Set(rareCards.map((c) => c.listing.id)).size;

        const highlights: PublicRareCardHighlight[] = userCards
          .slice()
          .sort((a, b) => {
            const isRareA = (a.listing?.rarity || '').toLowerCase().includes('rare');
            const isRareB = (b.listing?.rarity || '').toLowerCase().includes('rare');
            if (isRareA && !isRareB) return -1;
            if (!isRareA && isRareB) return 1;
            return (b.quantity || 1) - (a.quantity || 1);
          })
          .slice(0, 4)
          .map((c) => ({
            cardId: c.listing.id,
            name: c.listing.name,
            imageUrl: c.listing.image || '/assets/expensive_card_1.png',
            rarity: c.listing.rarity || 'Common',
            quantity: c.quantity || 1,
          }));

        const isSeller = Boolean(user.isSeller || user.sellerStatus === 'APPROVED' || user.id === 'usr-3');

        return {
          userId: user.id,
          displayName: user.name || 'Collector',
          avatarUrl: user.avatarUrl ?? null,
          role: user.role,
          sellerStatus: user.sellerStatus,
          isSeller,
          totalCardsCount,
          rareCardCount,
          distinctRareCardCount,
          highlights,
        };
      });

      let filtered = summaries.filter((s) => s.totalCardsCount > 0);

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        filtered = filtered.filter((s) =>
          s.displayName.toLowerCase().includes(query) ||
          s.highlights.some((h) => h.name.toLowerCase().includes(query))
        );
      }

      if (role === 'SELLER') {
        filtered = filtered.filter((s) => s.isSeller);
      } else if (role === 'BUYER') {
        filtered = filtered.filter((s) => !s.isSeller);
      }

      filtered.sort((a, b) => {
        if (sort === 'TOTAL_DESC') {
          return b.totalCardsCount - a.totalCardsCount;
        }
        if (sort === 'NAME_ASC') {
          return a.displayName.localeCompare(b.displayName);
        }
        const rareDiff = b.rareCardCount - a.rareCardCount;
        if (rareDiff !== 0) return rareDiff;
        return b.totalCardsCount - a.totalCardsCount;
      });

      const totalElements = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / size));
      const pagedItems = filtered.slice(page * size, (page + 1) * size);

      return {
        items: pagedItems,
        page: {
          page,
          size,
          totalElements,
          totalPages,
        },
      };
    }

    const response = await apiClient.get<PublicCollectionsResponse>('/collections', {
      params: {
        search: search.trim() || undefined,
        page,
        size,
      },
    });

    return response.data;
  },
};
