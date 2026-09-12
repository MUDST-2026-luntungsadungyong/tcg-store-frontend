import type { User } from '@/entities/account/model/types';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import type { Notification } from '@/entities/notification/model/types';
import type {
  ReservationCartItem,
  ReservationOrder,
} from '@/entities/reservation/model/types';

import {
  mockCollection,
  mockListings,
  mockNotifications,
  mockReservations,
  mockUsers,
} from './data';

const STORAGE_KEYS = {
  LISTINGS: 'mythix_mock_listings_v2',
  USERS: 'mythix_mock_users_v6',
  RESERVATIONS: 'mythix_mock_reservations_v1',
  COLLECTION: 'mythix_mock_collection_v2',
  NOTIFICATIONS: 'mythix_mock_notifications_v1',
};

const RESERVATION_CART_STORAGE_PREFIX = 'mythix_reservation_cart_v2:';

type StoredUser = Partial<User> & { sellerStatus?: string };

function normalizeUsers(users: StoredUser[]): User[] {
  return users.map((user) => {
    const backendRole = String(user.role ?? 'USER').toUpperCase();
    return {
      ...user,
      role: backendRole === 'ADMIN' ? 'ADMIN' : 'USER',
      isSeller:
        user.isSeller === true
        || backendRole === 'SELLER'
        || user.sellerStatus?.toUpperCase() === 'VERIFIED',
    } as User;
  });
}

function reservationCartStorageKey(buyerId: string): string {
  return `${RESERVATION_CART_STORAGE_PREFIX}${encodeURIComponent(buyerId)}`;
}

export function initMockStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(mockListings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
  } else {
    const users = getStorageData<StoredUser>(STORAGE_KEYS.USERS);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(normalizeUsers(users)));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(mockReservations));
  }
  const existingCollection = localStorage.getItem(STORAGE_KEYS.COLLECTION);
  if (!existingCollection || existingCollection === '[]') {
    localStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(mockCollection));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(mockNotifications));
  }
}

export function getStorageData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function setStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  getListings: () => {
    const data = getStorageData<CardListing>(STORAGE_KEYS.LISTINGS);
    return data.length > 0 ? data : mockListings;
  },
  setListings: (listings: CardListing[]) => setStorageData(STORAGE_KEYS.LISTINGS, listings),

  getUsers: () => {
    const data = getStorageData<User>(STORAGE_KEYS.USERS);
    return data.length > 0 ? data : mockUsers;
  },
  setUsers: (users: User[]) => setStorageData(STORAGE_KEYS.USERS, users),

  getReservations: () => {
    const data = getStorageData<ReservationOrder>(STORAGE_KEYS.RESERVATIONS);
    return data.length > 0 ? data : mockReservations;
  },
  setReservations: (orders: ReservationOrder[]) => setStorageData(STORAGE_KEYS.RESERVATIONS, orders),

  getCollection: () => {
    const data = getStorageData<CollectionEntry>(STORAGE_KEYS.COLLECTION);
    return data.length > 0 ? data : mockCollection;
  },

  getReservationCart: (buyerId: string) =>
    getStorageData<ReservationCartItem>(reservationCartStorageKey(buyerId)),
  setReservationCart: (buyerId: string, items: ReservationCartItem[]) =>
    setStorageData(reservationCartStorageKey(buyerId), items),
  setCollection: (entries: CollectionEntry[]) => setStorageData(STORAGE_KEYS.COLLECTION, entries),

  getNotifications: () => getStorageData<Notification>(STORAGE_KEYS.NOTIFICATIONS),
  setNotifications: (notifications: Notification[]) =>
    setStorageData(STORAGE_KEYS.NOTIFICATIONS, notifications),
};
