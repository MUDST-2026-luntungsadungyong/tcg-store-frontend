import type { Role } from '@/entities/account/model/types';

const defaultDestinations: Record<Role, string> = {
  BUYER: '/',
  SELLER: '/workspace/listings',
  ADMIN: '/',
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
