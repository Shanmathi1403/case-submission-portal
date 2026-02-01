import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitCase, fetchCases } from '../src/api/casesApi';
import * as tokenUtils from '../src/utils/token';

// Mock the token utils
vi.mock('../src/utils/token', () => ({
  getAuthToken: vi.fn()
}));

describe('Cases API', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
    // Default mock: return a valid token
    vi.mocked(tokenUtils.getAuthToken).mockReturnValue('mock-jwt-token');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('submitCase', () => {
    it('should submit case successfully with auth token', async () => {
      const mockResponse = {
        referenceNumber: 'CASE-2026-0001',
        maskedPhone: '+65****5678',
        smsStatus: 'SENT',
        message: 'Case submitted successfully'
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const payload = {
        name: 'John Doe',
        phone: '+6512345678',
        title: 'Test Case',
        description: 'Test Description',
        countryCode: '+65'
      };

      const result = await submitCase(payload);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token'
          },
          body: JSON.stringify({
            name: 'John Doe',
            phone: '+6512345678',
            title: 'Test Case',
            description: 'Test Description'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when no token is available', async () => {
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue(null);

      const payload = {
        name: 'Jane Doe',
        phone: '+6587654321',
        title: 'Another Case',
        description: 'Another Description',
        countryCode: '+65'
      };

      await expect(submitCase(payload)).rejects.toThrow('You must be logged in');
    });

    it('should exclude countryCode from request body', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ referenceNumber: 'CASE-2026-0001' })
      });

      const payload = {
        name: 'Test',
        phone: '+6512345678',
        title: 'Test',
        description: 'Test',
        countryCode: '+65'
      };

      await submitCase(payload);

      const callArgs = fetchSpy.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.countryCode).toBeUndefined();
      expect(body.phone).toBe('+6512345678');
    });

    it('should throw error on failed request', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Validation failed' })
      });

      const payload = {
        name: 'Test',
        phone: '+6512345678',
        title: 'Test',
        description: 'Test'
      };

      await expect(submitCase(payload)).rejects.toThrow('Validation failed');
    });

    it('should throw generic error if no message in response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      const payload = {
        name: 'Test',
        phone: '+6512345678',
        title: 'Test',
        description: 'Test'
      };

      await expect(submitCase(payload)).rejects.toThrow('Request failed');
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const payload = {
        name: 'Test',
        phone: '+6512345678',
        title: 'Test',
        description: 'Test'
      };

      await expect(submitCase(payload)).rejects.toThrow('Network error');
    });
  });

  describe('fetchCases', () => {
    it('should fetch cases successfully with auth token', async () => {
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

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ cases: mockCases })
      });

      const result = await fetchCases();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock-jwt-token'
          }
        })
      );
      expect(result.cases).toEqual(mockCases);
    });

    it('should throw error when no token is available', async () => {
      vi.mocked(tokenUtils.getAuthToken).mockReturnValue(null);

      await expect(fetchCases()).rejects.toThrow('You must be logged in');
    });

    it('should throw error on failed request', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(fetchCases()).rejects.toThrow('Unauthorized');
    });

    it('should throw generic error if no message in response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({})
      });

      await expect(fetchCases()).rejects.toThrow('Request failed');
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(fetchCases()).rejects.toThrow('Network error');
    });

    it('should handle empty cases array', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ cases: [] })
      });

      const result = await fetchCases();

      expect(result.cases).toEqual([]);
    });
  });

  describe('API base URL', () => {
    it('should use environment variable for API base', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ cases: [] })
      });

      await fetchCases();

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^http:\/\/.+\/api\/cases$/),
        expect.any(Object)
      );
    });
  });
});
