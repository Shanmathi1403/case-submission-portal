const AWS = require('aws-sdk');
const crypto = require('crypto');
const { validateCaseInput } = require('../cases/cases.validation');
const smsService = require('../sms/sms.service');

const dynamo = new AWS.DynamoDB.DocumentClient();

const maskPhone = (phone) => {
  if (!phone) {
    return '';
  }

  const trimmed = String(phone);
  if (trimmed.length <= 4) {
    return '****';
  }

  const prefixLength = Math.min(3, Math.max(1, trimmed.length - 4));
  const prefix = trimmed.slice(0, prefixLength);
  const suffix = trimmed.slice(-4);
  return `${prefix}****${suffix}`;
};
const TABLE_NAME_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'case-submission';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const BUILD_VERSION = process.env.BUILD_VERSION || 'dev';
const LAYER_VERSION = process.env.LAYER_VERSION || 'unknown';

console.log('Lambda build version', BUILD_VERSION, 'layer version', LAYER_VERSION);

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  },
  body: JSON.stringify(body)
});

const getBearerToken = (headers) => {
  const authHeader = headers?.authorization || headers?.Authorization || '';
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    return null;
  }
  return token;
};

const generateId = () => crypto.randomUUID();

const buildReferenceNumber = () => {
  const year = new Date().getFullYear();
  const suffix = String(Date.now() % 10000).padStart(4, '0');
  return `CASE-${year}-${suffix}`;
};

const parseJsonBody = (event) => {
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf-8')
    : event.body || '';

  return JSON.parse(rawBody || '{}');
};

const validatePayload = (payload) => {
  try {
    return validateCaseInput(payload);
  } catch (err) {
    const error = new Error('Invalid request payload');
    error.status = err.status || 400;
    error.details = err.details;
    throw error;
  }
};

const getEnv = () => ({
  TABLE_NAME_PREFIX,
  smsProvider: smsService.providerName,
  buildVersion: BUILD_VERSION,
  layerVersion: LAYER_VERSION
});

module.exports = {
  dynamo,
  jsonResponse,
  getBearerToken,
  generateId,
  buildReferenceNumber,
  parseJsonBody,
  validatePayload,
  getEnv,
  maskPhone,
  smsService
};
