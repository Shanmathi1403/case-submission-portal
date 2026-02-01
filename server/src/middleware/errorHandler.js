const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const response = {
    message: err.message || 'Internal server error'
  };

  if (err.details) {
    response.details = err.details;
  }

  logger.error('Request failed', {
    method: req.method,
    path: req.path,
    status,
    phone: req.body?.phone
  });

  res.status(status).json(response);
};

module.exports = errorHandler;
