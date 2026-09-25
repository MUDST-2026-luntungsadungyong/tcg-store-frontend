import { render, screen, waitFor } from '@testing-library/react';
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
  const mockApplications: SellerApplication[] = [
    {
      id: 'app-1',
      userId: 'user-9',
      applicantName: 'Misty Cerulean',
      applicantEmail: 'misty@mythix.com',
      shopName: 'Cerulean Water Gym Cards',
      shopDescription: 'Official Water Pokemon Cards',
      sellerStatus: 'PENDING',
      requestedAt: '2026-09-24T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders application list with applicant details and review count', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce(mockApplications);

    render(<AdminSellerApplicationsPage />);

    expect(screen.getByRole('heading', { name: 'Seller applications' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Misty Cerulean')).toBeInTheDocument();
    });

    expect(screen.getByText('Cerulean Water Gym Cards')).toBeInTheDocument();
    expect(screen.getByText('Official Water Pokemon Cards')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('displays empty queue state when there are no applications awaiting review', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce([]);

    render(<AdminSellerApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('The review queue is clear')).toBeInTheDocument();
    });

    expect(screen.getByText(/New seller applications will appear here/i)).toBeInTheDocument();
  });

  it('approves an application and removes it from the list', async () => {
    vi.mocked(sellerApplicationsApi.listPending).mockResolvedValueOnce([...mockApplications]);
    vi.mocked(sellerApplicationsApi.approve).mockResolvedValueOnce({
      ...mockApplications[0],
      sellerStatus: 'APPROVED',
    });

    render(<AdminSellerApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Misty Cerulean')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    await userEvent.click(approveButton);

    expect(sellerApplicationsApi.approve).toHaveBeenCalledWith('app-1');

    await waitFor(() => {
      expect(screen.queryByText('Misty Cerulean')).not.toBeInTheDocument();
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
      expect(screen.getByText('Misty Cerulean')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: 'Reject' });
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
      expect(screen.queryByText('Misty Cerulean')).not.toBeInTheDocument();
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
