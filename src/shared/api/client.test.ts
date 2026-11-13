import { afterEach, describe, expect, it, vi } from 'vitest';
import client, { configureApiClientAuth } from './client';

describe('password recovery requests', () => {
  afterEach(() => { delete client.defaults.adapter; });

  it('does not attach an expired access token to recovery requests', async () => {
    const onUnauthorized = vi.fn();
    configureApiClientAuth({ getAccessToken: () => 'expired-token', onUnauthorized });
    const headers: Array<string | undefined> = [];
    client.defaults.adapter = async (config) => {
      headers.push(config.headers.get('Authorization') as string | undefined);
      return { data: null, status: 204, statusText: 'No Content', headers: {}, config };
    };
    await client.post('/auth/forgot-password', { email: 'person@example.com' });
    await client.post('/auth/reset-password', { token: 'reset-token', newPassword: 'Password123' });
    await client.get('/auth/me');
    expect(headers).toEqual([undefined, undefined, 'Bearer expired-token']);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('multipart evidence requests', () => {
  afterEach(() => { delete client.defaults.adapter; });

  it('keeps ordinary request bodies as JSON', async () => {
    client.defaults.adapter = async (config) => {
      expect(config.data).toBe('{"reason":"Review requested"}');
      expect(config.headers.get('Content-Type')).toBe('application/json');
      return { data: null, status: 200, statusText: 'OK', headers: {}, config };
    };
    await client.post('/example', { reason: 'Review requested' });
  });

  it.each(['/auctions/6/disputes', '/auction-disputes/1/evidence'])(
    'preserves evidence files as FormData for %s', async (url) => {
      const body = new FormData();
      const evidence = new File(['image'], 'evidence.png', { type: 'image/png' });
      body.append('reason', 'Wrong card received');
      body.append('evidence', evidence);
      client.defaults.adapter = async (config) => {
        expect(config.data).toBe(body);
        expect(config.data.get('evidence')).toBe(evidence);
        expect(config.headers.get('Content-Type')).not.toContain('application/json');
        return { data: null, status: 201, statusText: 'Created', headers: {}, config };
      };
      await client.post(url, body);
    }
  );
});
