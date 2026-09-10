import type { User } from '@/entities/account/model/types';
import type { CardListing, CollectionEntry } from '@/entities/card/model/types';
import type { Notification } from '@/entities/notification/model/types';
import type { ReservationOrder } from '@/entities/reservation/model/types';

import {
  mockCollection,
  mockListings,
  mockNotifications,
  mockReservations,
  mockUsers,
} from './data';

const STORAGE_KEYS = {
  LISTINGS: 'mythix_mock_listings_v1',
  USERS: 'mythix_mock_users_v5',
  RESERVATIONS: 'mythix_mock_reservations_v1',
  COLLECTION: 'mythix_mock_collection_v1',
  NOTIFICATIONS: 'mythix_mock_notifications_v1',
};

export function initMockStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(mockListings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(mockReservations));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COLLECTION)) {
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
  getListings: () => getStorageData<CardListing>(STORAGE_KEYS.LISTINGS),
  setListings: (listings: CardListing[]) => setStorageData(STORAGE_KEYS.LISTINGS, listings),

  getUsers: () => getStorageData<User>(STORAGE_KEYS.USERS),
  setUsers: (users: User[]) => setStorageData(STORAGE_KEYS.USERS, users),

  getReservations: () => getStorageData<ReservationOrder>(STORAGE_KEYS.RESERVATIONS),
  setReservations: (orders: ReservationOrder[]) => setStorageData(STORAGE_KEYS.RESERVATIONS, orders),

  getCollection: () => getStorageData<CollectionEntry>(STORAGE_KEYS.COLLECTION),
  setCollection: (entries: CollectionEntry[]) => setStorageData(STORAGE_KEYS.COLLECTION, entries),

  getNotifications: () => getStorageData<Notification>(STORAGE_KEYS.NOTIFICATIONS),
  setNotifications: (notifications: Notification[]) =>
    setStorageData(STORAGE_KEYS.NOTIFICATIONS, notifications),
};
