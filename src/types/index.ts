export type Role = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';
export type ProductStatus = 'SHOW' | 'HIDE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  game: string; // e.g., 'Pokemon', 'YGO', 'MTG', 'One Piece'
  image: string;
  price: number;
  cost: number;
  stock: number;
  status: ProductStatus;
  condition?: string;
  set?: string;
  rarity?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
  trackingNumber?: string;
  createdAt: string;
}
