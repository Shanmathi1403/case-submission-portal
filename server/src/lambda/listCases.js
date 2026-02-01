const jwt = require('jsonwebtoken');
const {
  dynamo,
  jsonResponse,
  getBearerToken,
  getEnv
} = require('./shared');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production-please';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const handle = async (event) => {
  const token = getBearerToken(event.headers || {});
  if (!token) {
    return jsonResponse(401, { message: 'Authorization token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return jsonResponse(401, { message: 'Invalid or expired token' });
  }

  const { TABLE_NAME_PREFIX } = getEnv();

  const result = await dynamo
    .query({
      TableName: `${TABLE_NAME_PREFIX}-cases`,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': decoded.userId
      },
      ScanIndexForward: false
    })
    .promise();

  const cases = (result.Items || []).map((item) => ({
    id: item.id,
    referenceNumber: item.reference_number,
    title: item.title,
    status: item.status,
    smsStatus: item.sms_status,
    createdAt: item.created_at || new Date(item.createdAt).toISOString()
  }));

  return jsonResponse(200, { cases });
};

exports.handler = async (event) => {
  if ((event.requestContext?.http?.method || event.httpMethod) === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: ''
    };
  }

  return handle(event);
};
