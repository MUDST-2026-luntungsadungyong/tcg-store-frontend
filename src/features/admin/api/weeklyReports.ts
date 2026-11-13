import apiClient from '@/shared/api/client';

export type CardPerformance = { cardId: string; name: string; unitsSold: number; revenue: number; grossProfit: number };
export type StagnantListing = { productId: number; sellerId: number; cardId: string; name: string; onHand: number; inventoryValue: number; listedAt: string };
export type WeeklyReport = {
  weekEndDate: string; periodStart: string; periodEnd: string; generatedAt: string;
  stockAdded: number | null; stockRemoved: number | null; unitsSold: number; inventoryUnits: number | null;
  totalInventoryValue: number | null; inventoryCost: number | null; revenue: number; grossProfit: number;
  totalFeesCollected: number; topByRevenue: CardPerformance[]; topByProfit: CardPerformance[];
  stagnantListings: number | null; stagnantUnits: number | null; stagnantValue: number | null;
  stagnantInventory: StagnantListing[]; reportType?: 'TRACKED' | 'RECONSTRUCTED_SALES_ONLY';
};
export type WeeklyHistory = {
  content: { weekEndDate: string; generatedAt: string; totalInventoryValue: number | null; totalFeesCollected: number; reportType?: 'TRACKED' | 'RECONSTRUCTED_SALES_ONLY' }[];
  number: number; size: number; totalElements: number; totalPages: number; trackingSince: string;
};
const path = '/admin/reports/weekly-summary';
export const weeklyReports = {
  async history(page: number, signal?: AbortSignal) {
    return (await apiClient.get<WeeklyHistory>(`${path}/history`, { params: { page, size: 20 }, signal })).data;
  },
  async get(weekEnd: string, signal?: AbortSignal) {
    return (await apiClient.get<WeeklyReport>(path, { params: { weekEnd }, signal })).data;
  },
  async download(weekEnd: string) {
    const { data } = await apiClient.get<Blob>(`${path}/export`, { params: { weekEnd }, responseType: 'blob' });
    const url = URL.createObjectURL(data);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `weekly-report-${weekEnd}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      // Allow the browser to begin the download before releasing its object URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  },
};
