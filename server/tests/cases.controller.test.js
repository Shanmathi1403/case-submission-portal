const { createCase, listCases } = require('../src/cases/cases.controller');
const casesService = require('../src/cases/cases.service');
const authService = require('../src/auth/auth.service');
const { validateCaseInput } = require('../src/cases/cases.validation');

jest.mock('../src/cases/cases.service');
jest.mock('../src/auth/auth.service');
jest.mock('../src/cases/cases.validation');

describe('Cases Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createCase', () => {
    it('should create a case successfully with JWT token', async () => {
      req.headers.authorization = 'Bearer mock-jwt-token';
      const mockPayload = {
        name: 'John Doe',
        phone: '+6512345678',
        title: 'Test Case',
        description: 'Test Description'
      };
      
      const mockResult = {
        referenceNumber: 'CASE-2026-0001',
        smsStatus: 'SENT',
        smsProvider: 'MOCK',
        maskedPhone: '+65****5678'
      };

      authService.verifyToken.mockReturnValue({ userId: 'user-123', username: 'testuser' });
      validateCaseInput.mockReturnValue(mockPayload);
      casesService.createCase.mockResolvedValue(mockResult);

      await createCase(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('mock-jwt-token');
      expect(validateCaseInput).toHaveBeenCalledWith(req.body);
      expect(casesService.createCase).toHaveBeenCalledWith(mockPayload, 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        referenceNumber: 'CASE-2026-0001',
        smsStatus: 'SENT',
        smsProvider: 'MOCK',
        maskedPhone: '+65****5678',
        message: 'Case submitted successfully'
      });
    });

    it('should reject request without authorization header', async () => {
      const mockPayload = {
        name: 'Jane Doe',
        phone: '+6587654321',
        title: 'Another Case',
        description: 'Another Description'
      };

      validateCaseInput.mockReturnValue(mockPayload);

      await createCase(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authorization token required');
      expect(error.status).toBe(401);
    });

    it('should handle validation errors', async () => {
      const error = new Error('Invalid request payload');
      error.status = 400;
      validateCaseInput.mockImplementation(() => {
        throw error;
      });

      await createCase(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      req.headers.authorization = 'Bearer mock-jwt-token';
      const mockPayload = { name: 'Test', phone: '+6512345678', title: 'Test', description: 'Test' };
      authService.verifyToken.mockReturnValue({ userId: 'user-123', username: 'testuser' });
      validateCaseInput.mockReturnValue(mockPayload);
      
      const error = new Error('Database error');
      casesService.createCase.mockRejectedValue(error);

      await createCase(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should reject invalid authorization format', async () => {
      req.headers.authorization = 'InvalidFormat token123';
      const mockPayload = { name: 'Test', phone: '+6512345678', title: 'Test', description: 'Test' };
      validateCaseInput.mockReturnValue(mockPayload);

      await createCase(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authorization token required');
      expect(error.status).toBe(401);
    });
  });

  describe('listCases', () => {
    it('should list cases successfully with valid token', async () => {
      req.headers.authorization = 'Bearer valid-jwt-token';
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

      authService.verifyToken.mockReturnValue({ userId: 'user-123', username: 'testuser' });
      casesService.getCasesForUser.mockResolvedValue(mockCases);

      await listCases(req, res, next);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(casesService.getCasesForUser).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({ cases: mockCases });
    });

    it('should return error when authorization token is missing', async () => {
      await listCases(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authorization token required');
      expect(error.status).toBe(401);
    });

    it('should return error when authorization format is invalid', async () => {
      req.headers.authorization = 'InvalidFormat';

      await listCases(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authorization token required');
      expect(error.status).toBe(401);
    });

    it('should handle service errors', async () => {
      req.headers.authorization = 'Bearer valid-jwt-token';
      authService.verifyToken.mockReturnValue({ userId: 'user-123', username: 'testuser' });
      const error = new Error('Database error');
      casesService.getCasesForUser.mockRejectedValue(error);

      await listCases(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
