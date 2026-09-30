import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAuditLogsPage } from './AdminAuditLogsPage';
import apiClient from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({ default: { get: vi.fn() } }));

const sampleLog = {
  id: '101',
  action: 'APPROVE_SELLER',
  targetType: 'SELLER_APPLICATION',
  targetId: '99',
  actorId: '1',
  actorName: 'Platform Administrator',
  actorEmail: 'admin@mythix.com',
  actorRole: 'ADMIN',
  actorSellerStatus: 'NONE',
  details: '{"decision": "APPROVED", "shop_name": "Pewter City"}',
  createdAt: '2026-09-30T14:50:02Z',
};

const response = {
  data: {
    content: [sampleLog],
    number: 0,
    totalPages: 1,
    totalElements: 1,
  },
};

describe('AdminAuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(response);
  });

  it('renders audit logs with Role, Action, Actor, and Time', async () => {
    render(<AdminAuditLogsPage />);

    expect(screen.getByRole('heading', { name: 'Audit trail' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('APPROVE_SELLER')[0]).toBeInTheDocument());
    expect(screen.getAllByText('Platform Administrator')[0]).toBeInTheDocument();
    expect(screen.getAllByText('ADMIN')[0]).toBeInTheDocument();
  });

  it('filters by multiple actions when clicked', async () => {
    render(<AdminAuditLogsPage />);
    await screen.findAllByText('APPROVE_SELLER');

    const rejectBtn = screen.getByRole('button', { name: 'REJECT_SELLER' });
    await userEvent.click(rejectBtn);

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        '/admin/audit-logs',
        expect.objectContaining({
          params: expect.objectContaining({
            actions: ['REJECT_SELLER'],
          }),
        })
      )
    );
  });

  it('opens detail modal with complete log and actor information on row click', async () => {
    render(<AdminAuditLogsPage />);
    await screen.findAllByText('APPROVE_SELLER');

    const tableRow = screen.getAllByText('Platform Administrator')[0];
    await userEvent.click(tableRow);

    const modal = screen.getByTestId('modal-backdrop');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText('Log Information')).toBeInTheDocument();
    expect(within(modal).getByText('Actor Information')).toBeInTheDocument();
    expect(within(modal).getByText('admin@mythix.com')).toBeInTheDocument();
    expect(within(modal).getByText('SELLER_APPLICATION')).toBeInTheDocument();
    expect(within(modal).getByText('Action Details')).toBeInTheDocument();
  });

  it('closes calendar picker when clicking outside', async () => {
    render(<AdminAuditLogsPage />);
    await screen.findAllByText('APPROVE_SELLER');

    const dateRangeBtn = screen.getByRole('button', { name: 'Select audit log date range' });
    await userEvent.click(dateRangeBtn);

    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();

    // Click outside on heading
    await userEvent.click(screen.getByRole('heading', { name: 'Audit trail' }));

    expect(screen.queryByRole('button', { name: 'Previous month' })).not.toBeInTheDocument();
  });

  it('falls back to derived role if actorRole is missing or empty', async () => {
    const fallbackResponse = {
      data: {
        content: [
          {
            id: '102',
            action: 'UPDATE_STOCK',
            targetType: 'PRODUCT',
            targetId: '45',
            actorId: '2',
            actorName: 'System Worker',
            actorEmail: null,
            actorRole: '',
            actorSellerStatus: null,
            details: 'Stock sync',
            createdAt: '2026-09-30T14:50:02Z',
          },
        ],
        number: 0,
        totalPages: 1,
        totalElements: 1,
      },
    };
    vi.mocked(apiClient.get).mockResolvedValue(fallbackResponse);
    render(<AdminAuditLogsPage />);

    await waitFor(() => expect(screen.getAllByText('UPDATE_STOCK')[0]).toBeInTheDocument());
    expect(screen.getAllByText('SYSTEM')[0]).toBeInTheDocument();
  });
});

