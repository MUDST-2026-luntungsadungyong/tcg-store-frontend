import type { Role } from '@/shared/types';

const defaultDestinations: Record<Role, string> = {
  CUSTOMER: '/',
  SELLER: '/seller/inventory',
  ADMIN: '/platform-admin',
};

export function getPostAuthDestination(role: Role, state: unknown): string {
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
  return defaultDestinations[role];
}
