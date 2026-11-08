import { afterEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/shared/api/client';
import { weeklyReports } from './weeklyReports';
vi.mock('@/shared/api/client', () => ({ default: { get: vi.fn() } }));

describe('weekly report API', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  it('uses the shared authenticated client for history and selected week', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    await weeklyReports.history(2);
    await weeklyReports.get('2026-11-08');
    expect(apiClient.get).toHaveBeenCalledWith('/admin/reports/weekly-summary/history', { params: { page: 2, size: 20 }, signal: undefined });
    expect(apiClient.get).toHaveBeenCalledWith('/admin/reports/weekly-summary', { params: { weekEnd: '2026-11-08' }, signal: undefined });
  });
  it('downloads an authenticated blob and releases the object URL', async () => {
    vi.useFakeTimers();
    const blob = new Blob(['csv']);
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: blob });
    const create = vi.fn().mockReturnValue('blob:report');
    const revoke = vi.fn();
    vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = revoke; });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await weeklyReports.download('2026-11-08');
    expect(apiClient.get).toHaveBeenCalledWith('/admin/reports/weekly-summary/export', { params: { weekEnd: '2026-11-08' }, responseType: 'blob' });
    expect(create).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:report');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
