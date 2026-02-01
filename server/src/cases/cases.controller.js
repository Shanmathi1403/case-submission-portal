const { validateCaseInput } = require('./cases.validation');
const casesService = require('./cases.service');
const authService = require('../auth/auth.service');

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    const error = new Error('Authorization token required');
    error.status = 401;
    throw error;
  }
  
  const decoded = authService.verifyToken(token);
  return decoded;
};

const createCase = async (req, res, next) => {
  try {
    const payload = validateCaseInput(req.body);
    const user = getUserFromToken(req);
    const result = await casesService.createCase(payload, user.userId);
    res.status(201).json({
      referenceNumber: result.referenceNumber,
      smsStatus: result.smsStatus,
      smsProvider: result.smsProvider,
      maskedPhone: result.maskedPhone,
      message: 'Case submitted successfully'
    });
  } catch (err) {
    next(err);
  }
};

const listCases = async (req, res, next) => {
  try {
    const user = getUserFromToken(req);
    const cases = await casesService.getCasesForUser(user.userId);
    res.json({ cases });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCase,
  listCases
};
