const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

  const { username, password } = body;

  if (!username || !password) {
    return jsonResponse(400, { message: 'Username and password are required' });
  }

  // Get user
  const result = await dynamo
    .get({
      TableName: `${TABLE_NAME_PREFIX}-users`,
      Key: { username }
    })
    .promise();

  if (!result.Item) {
    return jsonResponse(401, { message: 'Invalid username or password' });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, result.Item.password_hash);

  if (!isValidPassword) {
    return jsonResponse(401, { message: 'Invalid username or password' });
  }

  const token = generateToken(result.Item.id, result.Item.username);

  console.log('User logged in', { userId: result.Item.id, username: result.Item.username });

  return jsonResponse(200, {
    token,
    user: { id: result.Item.id, username: result.Item.username, phone: result.Item.phone },
    message: 'Login successful'
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
    console.error('Error in login handler', err);
    return jsonResponse(500, { message: 'Internal server error' });
  }
};
