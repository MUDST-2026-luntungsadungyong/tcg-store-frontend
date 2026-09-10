export type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  line?: string;
  facebook?: string;
  avatarUrl?: string;
}
