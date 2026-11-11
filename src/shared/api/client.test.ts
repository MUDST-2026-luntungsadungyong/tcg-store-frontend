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
