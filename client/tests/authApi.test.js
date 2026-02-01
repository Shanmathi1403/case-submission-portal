import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { register, login } from '../src/api/authApi';

describe('Auth API', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        userId: 'user-123',
        username: 'testuser'
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await register('testuser', 'password123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when registration fails', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Username already exists' })
      });

      await expect(register('existinguser', 'password123'))
        .rejects.toThrow('Username already exists');
    });

    it('should throw generic error if no message in response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(register('testuser', 'password123'))
        .rejects.toThrow('Registration failed');
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(register('testuser', 'password123'))
        .rejects.toThrow('Network error');
    });

    it('should validate username is required', async () => {
      await expect(register('', 'password123'))
        .rejects.toThrow();
    });

    it('should validate password is required', async () => {
      await expect(register('testuser', ''))
        .rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        userId: 'user-123',
        username: 'testuser'
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await login('testuser', 'password123');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when login fails with invalid credentials', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid username or password' })
      });

      await expect(login('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid username or password');
    });

    it('should throw generic error if no message in response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(login('testuser', 'password123'))
        .rejects.toThrow('Login failed');
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(login('testuser', 'password123'))
        .rejects.toThrow('Network error');
    });

    it('should validate username is required', async () => {
      await expect(login('', 'password123'))
        .rejects.toThrow();
    });

    it('should validate password is required', async () => {
      await expect(login('testuser', ''))
        .rejects.toThrow();
    });
  });
});
