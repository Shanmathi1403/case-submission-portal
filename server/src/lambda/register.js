const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'case-submission';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production-please';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  },
  body: JSON.stringify(body)
});

const generateToken = (userId, username) => {
  return jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

const handle = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, { message: 'Invalid JSON body' });
  }

  const { username, password, phone } = body;

  if (!username || !password) {
    return jsonResponse(400, { message: 'Username and password are required' });
  }

  if (username.length < 3 || username.length > 50) {
    return jsonResponse(400, { message: 'Username must be 3-50 characters' });
  }

  if (password.length < 6) {
    return jsonResponse(400, { message: 'Password must be at least 6 characters' });
  }

  if (phone) {
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    if (!e164Pattern.test(phone)) {
      return jsonResponse(400, { message: 'Phone must be in E.164 format (e.g., +6591234567)' });
    }
  }

  // Check if user already exists
  const existingUser = await dynamo
    .get({
      TableName: `${TABLE_NAME_PREFIX}-users`,
      Key: { username }
    })
    .promise();

  if (existingUser.Item) {
    return jsonResponse(409, { message: 'Username already exists' });
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  await dynamo
    .put({
      TableName: `${TABLE_NAME_PREFIX}-users`,
      Item: {
        username,
        id: userId,
        password_hash: passwordHash,
        phone: phone || null,
        created_at: new Date().toISOString()
      }
    })
    .promise();

  const token = generateToken(userId, username);

  console.log('User registered', { userId, username });

  return jsonResponse(201, {
    token,
    user: { id: userId, username, phone },
    message: 'User registered successfully'
  });
};

exports.handler = async (event) => {
  if ((event.requestContext?.http?.method || event.httpMethod) === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: ''
    };
  }

  try {
    return await handle(event);
  } catch (err) {
    console.error('Error in register handler', err);
    return jsonResponse(500, { message: 'Internal server error' });
  }
};
