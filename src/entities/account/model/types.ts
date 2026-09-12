export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isSeller: boolean;
  phone?: string;
  line?: string;
  facebook?: string;
  avatarUrl?: string;
}

export function isSellerUser(user: Pick<User, 'isSeller'> | null | undefined): boolean {
  return user?.isSeller === true;
}
