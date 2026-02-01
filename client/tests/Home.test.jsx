import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../src/pages/Home';
import * as tokenUtils from '../src/utils/token';

vi.mock('../src/utils/token');
vi.mock('../src/components/CaseForm', () => ({
  default: ({ onSuccess }) => (
    <div data-testid="case-form">
      <button onClick={() => onSuccess({
        referenceNumber: 'CASE-2026-0001',
        maskedPhone: '+65****5678',
        smsStatus: 'SENT'
      })}>
        Submit Mock
      </button>
    </div>
  )
}));

vi.mock('../src/components/CaseList', () => ({
  default: ({ refreshKey }) => (
    <div data-testid="case-list">
      <div>Refresh: {refreshKey}</div>
    </div>
  )
}));

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue('mock-jwt-token');
  });

  it('should render header and title', () => {
    render(<Home />);
    
    expect(screen.getByText(/case submission portal/i)).toBeInTheDocument();
  });

  it('should render CaseForm and CaseList components', () => {
    render(<Home />);
    
    expect(screen.getByTestId('case-form')).toBeInTheDocument();
    expect(screen.getByTestId('case-list')).toBeInTheDocument();
  });

  it('should not show success message initially', () => {
    render(<Home />);
    
    expect(screen.queryByText(/your case has been submitted successfully/i)).not.toBeInTheDocument();
  });

  it('should show success message after form submission', async () => {
    render(<Home />);
    
    const submitButton = screen.getByText('Submit Mock');
    submitButton.click();
    
    await waitFor(() => {
      expect(screen.getByText(/your case has been submitted successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/Reference number: CASE-2026-0001/i)).toBeInTheDocument();
    });
  });

  it('should update CaseList after successful submission', async () => {
    render(<Home />);
    
    expect(screen.getByText(/Refresh: 0/i)).toBeInTheDocument();
    
    const submitButton = screen.getByText('Submit Mock');
    submitButton.click();
    
    await waitFor(() => {
      expect(screen.getByText(/Refresh: 1/i)).toBeInTheDocument();
    });
  });

  it('should display masked phone in success message', async () => {
    render(<Home />);
    
    const submitButton = screen.getByText('Submit Mock');
    submitButton.click();
    
    await waitFor(() => {
      expect(screen.getByText(/\+65\*\*\*\*5678/i)).toBeInTheDocument();
    });
  });

  it('should display SMS status in success message', async () => {
    render(<Home />);
    
    const submitButton = screen.getByText('Submit Mock');
    submitButton.click();
    
    await waitFor(() => {
      expect(screen.getByText(/SMS notification sent to/i)).toBeInTheDocument();
    });
  });

  it('should increment refresh key on successful submission', async () => {
    render(<Home />);
    
    const submitButton = screen.getByText('Submit Mock');
    
    expect(screen.getByText(/Refresh: 0/i)).toBeInTheDocument();
    
    submitButton.click();
    await waitFor(() => {
      expect(screen.getByText(/Refresh: 1/i)).toBeInTheDocument();
    });
    
    submitButton.click();
    await waitFor(() => {
      expect(screen.getByText(/Refresh: 2/i)).toBeInTheDocument();
    });
  });
});
