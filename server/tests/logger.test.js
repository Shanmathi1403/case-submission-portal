const logger = require('../src/utils/logger');
const { maskPhone } = require('../src/utils/token');

jest.mock('../src/utils/token');

describe('Logger Utility', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    maskPhone.mockImplementation((phone) => `masked:${phone}`);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info message without metadata', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test message');
    });

    it('should log info message with metadata', () => {
      const meta = { userId: '123', action: 'create' };
      logger.info('User action', meta);
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] User action', meta);
    });

    it('should mask phone numbers in metadata', () => {
      const meta = { phone: '+6512345678', action: 'submit' };
      logger.info('Case submitted', meta);
      
      expect(maskPhone).toHaveBeenCalledWith('+6512345678');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Case submitted', {
        phone: 'masked:+6512345678',
        action: 'submit'
      });
    });

    it('should handle null metadata', () => {
      logger.info('Test message', null);
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test message');
    });

    it('should handle undefined metadata', () => {
      logger.info('Test message', undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test message');
    });

    it('should handle non-object metadata', () => {
      logger.info('Test message', 'string-meta');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test message');
    });

    it('should preserve other metadata fields when masking phone', () => {
      const meta = {
        phone: '+6512345678',
        userId: '123',
        timestamp: '2026-02-01'
      };
      logger.info('Test', meta);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test', {
        phone: 'masked:+6512345678',
        userId: '123',
        timestamp: '2026-02-01'
      });
    });
  });

  describe('error', () => {
    it('should log error message without metadata', () => {
      logger.error('Error occurred');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error occurred');
    });

    it('should log error message with metadata', () => {
      const meta = { code: 'ERR_001', details: 'Failed' };
      logger.error('Operation failed', meta);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Operation failed', meta);
    });

    it('should mask phone numbers in error metadata', () => {
      const meta = { phone: '+6587654321', error: 'SMS failed' };
      logger.error('SMS delivery failed', meta);
      
      expect(maskPhone).toHaveBeenCalledWith('+6587654321');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] SMS delivery failed', {
        phone: 'masked:+6587654321',
        error: 'SMS failed'
      });
    });

    it('should handle null metadata', () => {
      logger.error('Error message', null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message');
    });

    it('should handle undefined metadata', () => {
      logger.error('Error message', undefined);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message');
    });

    it('should handle non-object metadata', () => {
      logger.error('Error message', 123);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message');
    });

    it('should not modify metadata without phone field', () => {
      const meta = { userId: '456', action: 'delete' };
      logger.error('Delete failed', meta);
      
      expect(maskPhone).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Delete failed', meta);
    });
  });

  describe('metadata sanitization', () => {
    it('should not mutate original metadata object', () => {
      const meta = { phone: '+6512345678', data: 'value' };
      const originalMeta = { ...meta };
      
      logger.info('Test', meta);
      
      expect(meta).toEqual(originalMeta);
      expect(meta.phone).toBe('+6512345678'); // Original unchanged
    });

    it('should handle empty metadata object', () => {
      logger.info('Test', {});
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test', {});
    });
  });
});
