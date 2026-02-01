const errorHandler = require('../src/middleware/errorHandler');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/logger');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/cases',
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle error with custom status code', () => {
    const error = new Error('Validation failed');
    error.status = 400;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed'
    });
    expect(logger.error).toHaveBeenCalledWith('Request failed', {
      method: 'POST',
      path: '/api/cases',
      status: 400,
      phone: undefined
    });
  });

  it('should default to 500 status code if not specified', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Something went wrong'
    });
  });

  it('should use default message for errors without message', () => {
    const error = new Error();

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error'
    });
  });

  it('should include error details if present', () => {
    const error = new Error('Validation failed');
    error.status = 400;
    error.details = {
      fieldErrors: { name: ['Required'] }
    };

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      details: { fieldErrors: { name: ['Required'] } }
    });
  });

  it('should log phone number from request body if present', () => {
    req.body.phone = '+6512345678';
    const error = new Error('Test error');

    errorHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Request failed', {
      method: 'POST',
      path: '/api/cases',
      status: 500,
      phone: '+6512345678'
    });
  });

  it('should handle 401 unauthorized errors', () => {
    const error = new Error('Unauthorized');
    error.status = 401;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized'
    });
  });

  it('should handle 404 not found errors', () => {
    const error = new Error('Not found');
    error.status = 404;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Not found'
    });
  });

  it('should handle 429 rate limit errors', () => {
    const error = new Error('Too many requests');
    error.status = 429;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Too many requests'
    });
  });
});
