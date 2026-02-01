const casesService = require('../src/cases/cases.service');
const repository = require('../src/cases/cases.repository');
const smsService = require('../src/sms/sms.service');

jest.mock('../src/cases/cases.repository');
jest.mock('../src/sms/sms.service');
jest.mock('../src/utils/logger');

describe('Cases Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    smsService.providerName = 'MOCK';
    repository.listCasesByUserId = jest.fn();
  });

  describe('createCase', () => {
    it('should create a case successfully with SMS sent', async () => {
      const caseData = {
        name: 'John Doe',
        phone: '+6512345678',
        title: 'Test Case',
        description: 'Test Description'
      };
      const userId = 'user-123';

      repository.getNextReferenceNumber.mockResolvedValue('CASE-2026-0001');
      repository.insertCase.mockResolvedValue();
      smsService.sendSms.mockResolvedValue();
      repository.updateSmsStatus.mockResolvedValue();

      const result = await casesService.createCase(caseData, userId);

      expect(repository.getNextReferenceNumber).toHaveBeenCalled();
      expect(repository.insertCase).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceNumber: 'CASE-2026-0001',
          name: 'John Doe',
          phone: '+6512345678',
          title: 'Test Case',
          description: 'Test Description',
          userId: 'user-123',
          smsStatus: 'PENDING',
          smsProvider: 'MOCK'
        })
      );
      expect(smsService.sendSms).toHaveBeenCalledWith(
        '+6512345678',
        expect.stringContaining('CASE-2026-0001')
      );
      expect(repository.updateSmsStatus).toHaveBeenCalledWith(
        expect.any(String),
        'SENT'
      );
      expect(result.referenceNumber).toBe('CASE-2026-0001');
      expect(result.smsStatus).toBe('SENT');
    });

    it('should retry SMS sending on failure', async () => {
      const caseData = {
        name: 'John Doe',
        phone: '+6512345678',
        title: 'Test Case',
        description: 'Test Description'
      };
      const userId = 'user-123';

      repository.getNextReferenceNumber.mockResolvedValue('CASE-2026-0003');
      repository.insertCase.mockResolvedValue();
      smsService.sendSms
        .mockRejectedValueOnce(new Error('SMS failed'))
        .mockRejectedValueOnce(new Error('SMS failed'))
        .mockResolvedValueOnce();
      repository.updateSmsStatus.mockResolvedValue();

      const result = await casesService.createCase(caseData, userId);

      expect(smsService.sendSms).toHaveBeenCalledTimes(3);
      expect(result.smsStatus).toBe('SENT');
    });

    it('should mark SMS as FAILED after all retries fail', async () => {
      const caseData = {
        name: 'John Doe',
        phone: '+6512345678',
        title: 'Test Case',
        description: 'Test Description'
      };
      const userId = 'user-123';

      repository.getNextReferenceNumber.mockResolvedValue('CASE-2026-0004');
      repository.insertCase.mockResolvedValue();
      smsService.sendSms.mockRejectedValue(new Error('SMS failed'));
      repository.updateSmsStatus.mockResolvedValue();

      const result = await casesService.createCase(caseData, userId);

      expect(smsService.sendSms).toHaveBeenCalledTimes(3);
      expect(result.smsStatus).toBe('FAILED');
      expect(repository.updateSmsStatus).toHaveBeenCalledWith(
        expect.any(String),
        'FAILED'
      );
    });

    it('should continue even if SMS status update fails', async () => {
      const caseData = {
        name: 'John Doe',
        phone: '+6512345678',
        title: 'Test Case',
        description: 'Test Description'
      };

      repository.getNextReferenceNumber.mockResolvedValue('CASE-2026-0005');
      repository.insertCase.mockResolvedValue();
      smsService.sendSms.mockResolvedValue();
      repository.updateSmsStatus.mockRejectedValue(new Error('Update failed'));

      const result = await casesService.createCase(caseData, 'user-123');

      expect(result.referenceNumber).toBe('CASE-2026-0005');
      expect(result.smsStatus).toBe('SENT');
    });
  });

  describe('getCasesForUser', () => {
    it('should retrieve cases for a specific user', async () => {
      const userId = 'user-123';
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

      repository.listCasesByUserId.mockResolvedValue(mockCases);

      const result = await casesService.getCasesForUser(userId);

      expect(repository.listCasesByUserId).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        referenceNumber: 'CASE-2026-0001',
        title: 'Test Case 1',
        status: 'SUBMITTED',
        smsStatus: 'SENT',
        createdAt: '2026-02-01T10:00:00Z'
      });
    });

    it('should return empty array when no cases found', async () => {
      repository.listCasesByUserId.mockResolvedValue([]);

      const result = await casesService.getCasesForUser('user-123');

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      repository.listCasesByUserId.mockRejectedValue(new Error('Database error'));

      await expect(casesService.getCasesForUser('user-123')).rejects.toThrow('Database error');
    });
  });
});
