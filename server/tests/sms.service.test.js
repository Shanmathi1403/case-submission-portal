const mockProvider = require('../src/sms/providers/mock.provider');

// Mock the SMS service to use mock provider
jest.mock('../src/config/env', () => ({
  SMS_PROVIDER: 'mock',
  DATABASE_PATH: ':memory:',
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX: 10
}));

const smsService = require('../src/sms/sms.service');

describe('SMS Service', () => {
  describe('sendSms', () => {
    it('should send SMS using the configured provider', async () => {
      const result = await smsService.sendSms('+6512345678', 'Test message');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle valid phone numbers', async () => {
      await expect(
        smsService.sendSms('+6512345678', 'Hello')
      ).resolves.not.toThrow();
    });

    it('should handle various message lengths', async () => {
      const shortMessage = 'Hi';
      const longMessage = 'a'.repeat(500);
      
      await expect(
        smsService.sendSms('+6512345678', shortMessage)
      ).resolves.not.toThrow();
      
      await expect(
        smsService.sendSms('+6512345678', longMessage)
      ).resolves.not.toThrow();
    });
  });

  describe('providerName', () => {
    it('should expose the provider name', () => {
      expect(smsService.providerName).toBeDefined();
      expect(typeof smsService.providerName).toBe('string');
      expect(['MOCK', 'SNS', 'TWILIO']).toContain(smsService.providerName);
    });

    it('should use MOCK provider in test environment', () => {
      expect(smsService.providerName).toBe('MOCK');
    });
  });
});
