import type { Product, User, Order } from '@/types';
import { mockProducts, mockUsers, mockOrders } from './mock/data';

const STORAGE_KEYS = {
  PRODUCTS: 'mythix_mock_products_v3',
  USERS: 'mythix_mock_users_v4',
  ORDERS: 'mythix_mock_orders_v3',
};

// Initialize mock data in local storage if not exists
export function initMockStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mockProducts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
  }
}

// Generic get helper
export function getStorageData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Generic set helper
export function setStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Specific getters/setters
export const storage = {
  getProducts: () => getStorageData<Product>(STORAGE_KEYS.PRODUCTS),
  setProducts: (products: Product[]) => setStorageData(STORAGE_KEYS.PRODUCTS, products),
  
  getUsers: () => getStorageData<User>(STORAGE_KEYS.USERS),
  setUsers: (users: User[]) => setStorageData(STORAGE_KEYS.USERS, users),
  
  getOrders: () => getStorageData<Order>(STORAGE_KEYS.ORDERS),
  setOrders: (orders: Order[]) => setStorageData(STORAGE_KEYS.ORDERS, orders),
};
