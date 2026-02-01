const path = require('path');

// Only load dotenv in non-Lambda environments
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
}

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  PORT: parseNumber(process.env.PORT, 4000),
  DATABASE_PATH:
    process.env.DATABASE_PATH ||
    path.resolve(__dirname, '..', '..', 'data', 'database.sqlite'),
  DATABASE_TYPE: process.env.DATABASE_TYPE || 'sqlite',
  DYNAMODB_TABLE_PREFIX: process.env.DYNAMODB_TABLE_PREFIX || 'case-submission',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mock',
  RATE_LIMIT_WINDOW_MS: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000),
  RATE_LIMIT_MAX: parseNumber(process.env.RATE_LIMIT_MAX, 10),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  SNS_SENDER_ID: process.env.SNS_SENDER_ID || '',
  SNS_SMS_TYPE: process.env.SNS_SMS_TYPE || 'Transactional',
  SNS_ORIGINATION_NUMBER: process.env.SNS_ORIGINATION_NUMBER || '',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-in-production-please'
};

module.exports = env;
