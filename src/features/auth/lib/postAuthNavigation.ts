import { isSellerUser, type User } from '@/entities/account/model/types';

const defaultDestinations: Record<User['role'], string> = {
  USER: '/',
  ADMIN: '/',
};

export function getPostAuthDestination(user: Pick<User, 'role' | 'isSeller'>, state: unknown): string {
  if (
    typeof state === 'object'
    && state !== null
    && 'from' in state
    && typeof state.from === 'string'
    && state.from.startsWith('/')
    && !state.from.startsWith('//')
  ) {
    return state.from;
  }
  return isSellerUser(user) ? '/workspace/listings' : defaultDestinations[user.role];
}
