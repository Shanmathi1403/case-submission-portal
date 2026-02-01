import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveAuthToken, getAuthToken, clearAuthToken } from '../src/utils/token';

describe('Token Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveAuthToken', () => {
    it('should save token to localStorage', () => {
      saveAuthToken('test-jwt-token-123');
      expect(localStorage.getItem('authToken')).toBe('test-jwt-token-123');
    });

    it('should overwrite existing token', () => {
      saveAuthToken('old-token');
      saveAuthToken('new-token');
      expect(localStorage.getItem('authToken')).toBe('new-token');
    });

    it('should handle empty string', () => {
      saveAuthToken('');
      expect(localStorage.getItem('authToken')).toBe('');
    });

    it('should handle JWT tokens', () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc';
      saveAuthToken(jwtToken);
      expect(localStorage.getItem('authToken')).toBe(jwtToken);
    });
  });

  describe('getAuthToken', () => {
    it('should retrieve saved token', () => {
      localStorage.setItem('authToken', 'stored-jwt-token');
      expect(getAuthToken()).toBe('stored-jwt-token');
    });

    it('should return null if no token exists', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('should return empty string if token is empty', () => {
      localStorage.setItem('authToken', '');
      expect(getAuthToken()).toBe('');
    });
  });

  describe('clearAuthToken', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('authToken', 'test-token');
      clearAuthToken();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should not throw error if token does not exist', () => {
      expect(() => clearAuthToken()).not.toThrow();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should only remove auth token, not other items', () => {
      localStorage.setItem('authToken', 'token');
      localStorage.setItem('otherKey', 'otherValue');
      
      clearAuthToken();
      
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('otherKey')).toBe('otherValue');
    });
  });

  describe('token persistence', () => {
    it('should persist token across get/set operations', () => {
      saveAuthToken('persistent-token');
      expect(getAuthToken()).toBe('persistent-token');
      
      saveAuthToken('new-persistent-token');
      expect(getAuthToken()).toBe('new-persistent-token');
    });

    it('should handle save, get, clear cycle', () => {
      saveAuthToken('cycle-token');
      expect(getAuthToken()).toBe('cycle-token');
      
      clearAuthToken();
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('token key', () => {
    it('should use correct storage key', () => {
      saveAuthToken('test-token');
      expect(localStorage.getItem('authToken')).toBe('test-token');
      expect(localStorage.getItem('caseViewerToken')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
