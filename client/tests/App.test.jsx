import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';
import * as tokenUtils from '../src/utils/token';

vi.mock('../src/utils/token');
vi.mock('../src/components/AuthForm', () => ({
  default: ({ onSuccess }) => (
    <div data-testid="auth-form">
      <button onClick={() => onSuccess?.({ token: 'mock-token', username: 'testuser' })}>
        Mock Login
      </button>
    </div>
  )
}));
vi.mock('../src/pages/Home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue(null);
    vi.mocked(tokenUtils.saveAuthToken).mockImplementation(() => {});
    vi.mocked(tokenUtils.clearAuthToken).mockImplementation(() => {});
  });

  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('should show AuthForm when not authenticated', () => {
    render(<App />);
    expect(screen.getByTestId('auth-form')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('should show Home page when authenticated', () => {
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue('existing-token');
    
    render(<App />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-form')).not.toBeInTheDocument();
  });

  it('should save token after successful login', () => {
    render(<App />);
    
    const loginButton = screen.getByText('Mock Login');
    fireEvent.click(loginButton);
    
    expect(tokenUtils.saveAuthToken).toHaveBeenCalledWith('mock-token');
  });

  it('should show Home page after successful login', () => {
    render(<App />);
    
    const loginButton = screen.getByText('Mock Login');
    fireEvent.click(loginButton);
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-form')).not.toBeInTheDocument();
  });

  it('should show logout button when authenticated', () => {
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue('existing-token');
    
    render(<App />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should clear token and show AuthForm after logout', () => {
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue('existing-token');
    
    const { rerender } = render(<App />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    
    expect(tokenUtils.clearAuthToken).toHaveBeenCalled();
    
    // Simulate re-render after token cleared
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue(null);
    rerender(<App />);
    
    expect(screen.getByTestId('auth-form')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });
});

