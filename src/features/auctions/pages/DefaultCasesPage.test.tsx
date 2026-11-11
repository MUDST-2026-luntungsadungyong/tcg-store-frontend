import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { defaultCaseApi } from '../api/auctions';
import { AdminDefaultCasesPage } from './DefaultCasesPage';

afterEach(() => vi.restoreAllMocks());
it('requires a reason and confirmation before approving a case', async () => {
  const item = { id: 1, auctionId: 2, orderId: 3, orderNumber: 'AUC-3', buyerId: 4, sellerId: 5, reportReason: 'No contact', status: 'PENDING' as const, createdAt: '2026-11-11T00:00:00Z', decidedAt: null, decisionReason: null, history: [] };
  vi.spyOn(defaultCaseApi, 'admin').mockResolvedValue({ content: [item], number: 0, size: 20, totalElements: 1, totalPages: 1 });
  const decide = vi.spyOn(defaultCaseApi, 'decide').mockResolvedValue({ ...item, status: 'APPROVED' });
  render(<MemoryRouter><AdminDefaultCasesPage /></MemoryRouter>);
  expect(await screen.findByRole('link', { name: 'AUC-3' })).toHaveAttribute('href', '/admin/orders?orderNumber=AUC-3');
  await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
  expect(decide).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Confirm decision' })).toBeDisabled();
  await userEvent.type(screen.getByLabelText('Decision reason'), 'Reviewed report');
  await userEvent.click(screen.getByRole('button', { name: 'Confirm decision' }));
  expect(decide).toHaveBeenCalledWith(1, 'approve', 'Reviewed report');
});
