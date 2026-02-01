const { generateViewerToken, hashViewerToken, maskPhone } = require('../src/utils/token');

describe('Token Utilities', () => {
  describe('generateViewerToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateViewerToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateViewerToken();
      const token2 = generateViewerToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens multiple times without error', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateViewerToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('hashViewerToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token-123';
      const hash1 = hashViewerToken(token);
      const hash2 = hashViewerToken(token);
      expect(hash1).toBe(hash2);
    });

    it('should produce a 64-character hex string', () => {
      const token = 'test-token';
      const hash = hashViewerToken(token);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashViewerToken('token1');
      const hash2 = hashViewerToken('token2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = hashViewerToken('');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle long strings', () => {
      const longToken = 'a'.repeat(1000);
      const hash = hashViewerToken(longToken);
      expect(hash).toHaveLength(64);
    });
  });

  describe('maskPhone', () => {
    it('should mask a standard phone number', () => {
      expect(maskPhone('+6512345678')).toBe('+65****5678');
    });

    it('should mask a longer phone number', () => {
      expect(maskPhone('+861234567890')).toBe('+86****7890');
    });

    it('should mask a shorter phone number', () => {
      expect(maskPhone('+1234567')).toBe('+12****4567');
    });

    it('should handle very short phone numbers (4 or less)', () => {
      expect(maskPhone('+123')).toBe('****');
      expect(maskPhone('+12')).toBe('****');
      expect(maskPhone('+1')).toBe('****');
      expect(maskPhone('+')).toBe('****');
    });

    it('should handle empty string', () => {
      expect(maskPhone('')).toBe('');
    });

    it('should handle null', () => {
      expect(maskPhone(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(maskPhone(undefined)).toBe('');
    });

    it('should handle phone without country code prefix', () => {
      expect(maskPhone('12345678')).toBe('123****5678');
    });

    it('should preserve proper prefix and suffix lengths', () => {
      // For a 10-digit number: prefix=3, suffix=4
      expect(maskPhone('1234567890')).toBe('123****7890');
      
      // For a 15-digit number (max E.164): prefix=3, suffix=4
      expect(maskPhone('+123456789012345')).toBe('+12****2345');
    });

    it('should handle numeric input', () => {
      expect(maskPhone(6512345678)).toBe('651****5678');
    });

    it('should mask exactly 5 characters', () => {
      expect(maskPhone('12345')).toBe('1****2345');
    });
  });
});
