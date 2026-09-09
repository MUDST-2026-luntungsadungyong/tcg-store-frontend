export type Role = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';
export type ProductStatus = 'SHOW' | 'HIDE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  addressLine?: string;
  postalCode?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  cardLast4?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardBrand?: string;
  sellerStatus?: 'NONE' | 'VERIFIED';
}

export interface SellerVerificationInput {
  shopName: string;
  shopDescription?: string;
  phone?: string;
  contactLine?: string;
  contactFacebook?: string;
  line?: string;
  facebook?: string;
}

export interface SellerVerification {
  id: string;
  shopName: string;
  shopDescription?: string;
  phone?: string;
  line?: string;
  facebook?: string;
  sellerStatus: 'VERIFIED';
  verifiedAt: string;
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
  stage?: string;
  marketPrice?: number;
  subtitle?: string;
  cardNumber?: string;
  cardText?: string;
  gradingCompany?: string;
  grade?: string;
  year?: string | number;
  tournament?: string;
  certNumber?: string;
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
