import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyMetadata, routeMetadata, SITE_URL } from './metadata';

beforeEach(() => {
  document.head.innerHTML = '';
  vi.stubGlobal('window', { location: { origin: SITE_URL } });
});
afterEach(() => vi.unstubAllGlobals());

describe('search indexing policy', () => {
  it('consolidates marketplace aliases and excludes search/filter combinations', () => {
    expect(routeMetadata('/marketplace').path).toBe('/cards');
    expect(routeMetadata('/cards/', '?search=mew').noindex).toBe(true);
    expect(routeMetadata('/cards').noindex).toBe(false);
  });

  it.each(['/profile', '/workspace/listings', '/admin', '/orders/verify/secret', '/reset-password', '/collections/private-user', '/missing', '/cards/card-id', '/stores/seller-id'])(
    'defaults %s to noindex until explicitly public and loaded', path => {
      expect(routeMetadata(path).noindex).toBe(true);
    },
  );
});

describe('head metadata across navigation', () => {
  it('replaces card metadata when moving to account and then homepage without duplicates or token leaks', () => {
    applyMetadata({ title: 'Mew | Mythix', description: 'Mew card', path: '/cards/mew', image: 'https://images.example/mew.png' });
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute('content', 'https://images.example/mew.png');
    applyMetadata(routeMetadata('/reset-password', '?token=private-token'));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    expect(document.head.innerHTML).not.toContain('private-token');
    expect(document.head.innerHTML).not.toContain('https://images.example/mew.png');
    applyMetadata(routeMetadata('/'));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}/`);
  });

  it('excludes previews even for a public page', () => {
    vi.stubGlobal('window', { location: { origin: 'https://preview.pages.dev' } });
    applyMetadata(routeMetadata('/'));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  });

  it('strips query and fragment from canonical and rejects non-web image URLs', () => {
    applyMetadata({ title: 'Card', description: '<safe>', path: '/cards/mew?token=secret#fragment', image: 'javascript:alert(1)' });
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}/cards/mew`);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toMatch(/^https:/);
    expect(document.head.innerHTML).not.toContain('token=secret');
  });
});
