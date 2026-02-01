import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaseList from '../src/components/CaseList';
import * as casesApi from '../src/api/casesApi';
import * as tokenUtils from '../src/utils/token';

vi.mock('../src/api/casesApi');
vi.mock('../src/utils/token');

describe('CaseList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue('mock-jwt-token');
  });

  it('should show message when not authenticated', async () => {
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue(null);
    casesApi.fetchCases.mockRejectedValue(new Error('Unauthorized'));
    
    render(<CaseList refreshKey={0} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
    });
  });

  it('should fetch and display cases', async () => {
    const mockCases = [
      {
        id: '1',
        referenceNumber: 'CASE-2026-0001',
        title: 'Test Case 1',
        status: 'SUBMITTED',
        smsStatus: 'SENT',
        createdAt: '2026-02-01T10:00:00Z'
      },
      {
        id: '2',
        referenceNumber: 'CASE-2026-0002',
        title: 'Test Case 2',
        status: 'SUBMITTED',
        smsStatus: 'SENT',
        createdAt: '2026-02-01T11:00:00Z'
      }
    ];

    casesApi.fetchCases.mockResolvedValue({ cases: mockCases });

    render(<CaseList refreshKey={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('CASE-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Test Case 1')).toBeInTheDocument();
      expect(screen.getByText('CASE-2026-0002')).toBeInTheDocument();
      expect(screen.getByText('Test Case 2')).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching', () => {
    casesApi.fetchCases.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CaseList refreshKey={0} />);
    
    expect(screen.getByText(/loading cases/i)).toBeInTheDocument();
  });

  it('should show error message on fetch failure', async () => {
    casesApi.fetchCases.mockRejectedValue(new Error('Failed to fetch'));

    render(<CaseList refreshKey={0} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no cases', async () => {
    casesApi.fetchCases.mockResolvedValue({ cases: [] });

    render(<CaseList refreshKey={0} />);
    
    await waitFor(() => {
      expect(screen.getByText(/no cases submitted yet/i)).toBeInTheDocument();
    });
  });

  it('should refetch when refreshKey changes', async () => {
    const mockCases = [
      {
        id: '1',
        referenceNumber: 'CASE-2026-0001',
        title: 'Test Case',
        status: 'SUBMITTED',
        smsStatus: 'SENT',
        createdAt: '2026-02-01T10:00:00Z'
      }
    ];

    casesApi.fetchCases.mockResolvedValue({ cases: mockCases });

    const { rerender } = render(<CaseList refreshKey={0} />);
    
    await waitFor(() => {
      expect(casesApi.fetchCases).toHaveBeenCalledTimes(1);
    });

    rerender(<CaseList refreshKey={1} />);
    
    await waitFor(() => {
      expect(casesApi.fetchCases).toHaveBeenCalledTimes(2);
    });
  });

  it('should display case status and SMS status', async () => {
    const mockCases = [
      {
        id: '1',
        referenceNumber: 'CASE-2026-0001',
        title: 'Test Case',
        status: 'SUBMITTED',
        smsStatus: 'SENT',
        createdAt: '2026-02-01T10:00:00Z'
      }
    ];

    casesApi.fetchCases.mockResolvedValue({ cases: mockCases });

    render(<CaseList refreshKey={0} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Status: SUBMITTED/i)).toBeInTheDocument();
      expect(screen.getByText(/Notification: SMS SENT/i)).toBeInTheDocument();
    });
  });

  it('should display created date for each case', async () => {
    const mockCases = [
      {
        id: '1',
        referenceNumber: 'CASE-2026-0001',
        title: 'Test Case',
        status: 'SUBMITTED',
        smsStatus: 'SENT',
        createdAt: '2026-02-01T10:00:00Z'
      }
    ];

    casesApi.fetchCases.mockResolvedValue({ cases: mockCases });

    render(<CaseList refreshKey={0} />);
    
    await waitFor(() => {
      expect(screen.getByText('2026-02-01T10:00:00Z')).toBeInTheDocument();
    });
  });
});
