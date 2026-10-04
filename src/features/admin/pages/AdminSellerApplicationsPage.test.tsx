import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminSellerApplicationsPage } from './AdminSellerApplicationsPage';
import { sellerApplicationsApi, type SellerApplication } from '../api/sellerApplications';

vi.mock('../api/sellerApplications', () => ({
  sellerApplicationsApi: {
    listPending: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

describe('AdminSellerApplicationsPage', () => {
  const writeText = vi.fn();
  const mockApplications: SellerApplication[] = [
    {
      id: 'app-1',
      userId: 'user-9',
      applicantName: 'Misty Cerulean',
      applicantEmail: 'misty@mythix.com',
      shopName: 'Cerulean Water Gym Cards',
      shopDescription: 'Official Water Pokemon Cards',
      phone: '0812345678',
      line: 'misty.cards',
      facebook: 'misty.cards',
      sellerStatus: 'PENDING',
      requestedAt: '2026-09-24T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });

  it('renders application list with applicant details and review count', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce(mockApplications);

    render(<AdminSellerApplicationsPage />);

    expect(screen.getByRole('heading', { name: 'Seller applications' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Misty Cerulean')).toHaveLength(2);
    });

    expect(screen.getAllByText('Cerulean Water Gym Cards')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Approve' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Reject' })).toHaveLength(2);
  });

  it('displays empty queue state when there are no applications awaiting review', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce([]);

    render(<AdminSellerApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('The review queue is clear')).toBeInTheDocument();
    });

    expect(screen.getByText(/New seller applications will appear here/i)).toBeInTheDocument();
  });

  it('opens seller details before a decision', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce(mockApplications);
    render(<AdminSellerApplicationsPage />);
    await userEvent.click(await screen.findByRole('row', { name: 'View details for Cerulean Water Gym Cards' }));
    expect(screen.getByRole('heading', { name: 'Seller details' })).toBeInTheDocument();
    const modal = screen.getByTestId('modal-backdrop');
    expect(within(modal).getByText('Email')).toBeInTheDocument();
    expect(within(modal).getByText('Description')).toBeInTheDocument();
    expect(within(modal).getByText('Official Water Pokemon Cards')).toBeInTheDocument();
    expect(within(modal).getByText('0812345678')).toBeInTheDocument();
    expect(within(modal).getAllByText('misty.cards')).toHaveLength(2);
    await userEvent.click(within(modal).getByRole('button', { name: 'Copy Email' }));
    expect(writeText).toHaveBeenCalledWith('misty@mythix.com');
    await userEvent.click(within(modal).getByRole('button', { name: 'Close modal' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Seller details' })).not.toBeInTheDocument());
  });

  it('approves an application and removes it from the list', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce([...mockApplications]);
    vi.mocked(sellerApplicationsApi.approve).mockResolvedValueOnce({
      ...mockApplications[0],
      sellerStatus: 'APPROVED',
    });

    render(<AdminSellerApplicationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Misty Cerulean')).toHaveLength(2);
    });

    const approveButton = screen.getAllByRole('button', { name: 'Approve' })[0];
    await userEvent.click(approveButton);

    // Wait for the confirmation modal
    expect(await screen.findByRole('heading', { name: 'Approve seller application' })).toBeInTheDocument();

    // Click the actual approve button inside the modal
    const confirmApproveButton = screen.getByRole('button', { name: 'Approve application' });
    await userEvent.click(confirmApproveButton);

    expect(sellerApplicationsApi.approve).toHaveBeenCalledWith('app-1');

    await waitFor(() => {
      expect(screen.queryAllByText('Misty Cerulean')).toHaveLength(0);
    });
    expect(screen.getByText('The review queue is clear')).toBeInTheDocument();
  });

  it('opens rejection modal, requires a reason, and rejects application', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce([...mockApplications]);
    vi.mocked(sellerApplicationsApi.reject).mockResolvedValueOnce({
      ...mockApplications[0],
      sellerStatus: 'REJECTED',
    });

    render(<AdminSellerApplicationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Misty Cerulean')).toHaveLength(2);
    });

    const rejectButton = screen.getAllByRole('button', { name: 'Reject' })[0];
    await userEvent.click(rejectButton);

    // Modal should be open
    expect(screen.getByRole('heading', { name: 'Reject seller application' })).toBeInTheDocument();
    const reasonTextarea = screen.getByLabelText(/Reason for rejection/i);
    const confirmRejectBtn = screen.getByRole('button', { name: 'Reject application' });

    // Confirm button disabled when reason is empty
    expect(confirmRejectBtn).toBeDisabled();

    // Type rejection reason
    await userEvent.type(reasonTextarea, 'เอกสารบัตรประชาชนไม่ชัดเจน');
    expect(confirmRejectBtn).toBeEnabled();

    // Submit rejection
    await userEvent.click(confirmRejectBtn);

    expect(sellerApplicationsApi.reject).toHaveBeenCalledWith('app-1', 'เอกสารบัตรประชาชนไม่ชัดเจน');

    await waitFor(() => {
      expect(screen.queryAllByText('Misty Cerulean')).toHaveLength(0);
    });
  });

  it('displays error alert when listing applications fails', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockRejectedValueOnce(new Error('API failed'));

    render(<AdminSellerApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to load seller applications. Please try again.');
    });
  });
});
