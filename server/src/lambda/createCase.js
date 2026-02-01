const jwt = require('jsonwebtoken');
const {
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
} = require('./shared');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production-please';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendSmsWithRetry = async (phone, message, attempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await smsService.sendSms(phone, message);
      return { attempt, result };
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await sleep(500 * attempt);
      }
    }
  }

  throw lastError;
};

const handle = async (event) => {
  let payload;
  try {
    payload = parseJsonBody(event);
  } catch (err) {
    return jsonResponse(400, { message: 'Invalid JSON body' });
  }

  let data;
  try {
    data = validatePayload(payload);
  } catch (err) {
    return jsonResponse(err.status || 400, {
      message: err.message || 'Invalid request payload',
      details: err.details
    });
  }

  const token = getBearerToken(event.headers || {});
  if (!token) {
    return jsonResponse(401, { message: 'Authorization token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return jsonResponse(401, { message: 'Invalid or expired token' });
  }

  const referenceNumber = buildReferenceNumber();
  const createdAt = Date.now();
  const { TABLE_NAME_PREFIX, smsProvider } = getEnv();
  const maskedPhone = maskPhone(data.phone);

  const item = {
    userId: decoded.userId,
    id: generateId(),
    createdAt,
    reference_number: referenceNumber,
    name: data.name,
    phone: data.phone,
    title: data.title,
    description: data.description,
    status: 'SUBMITTED',
    sms_status: 'PENDING',
    sms_provider: smsProvider
  };

  await dynamo
    .put({
      TableName: `${TABLE_NAME_PREFIX}-cases`,
      Item: item
    })
    .promise();

  const message =
    'Your case {{referenceNumber}} has been successfully submitted. We will contact you if further details are required.';

  let smsStatus = 'PENDING';
  try {
    const { attempt, result } = await sendSmsWithRetry(
      data.phone,
      message.replace('{{referenceNumber}}', referenceNumber)
    );
    smsStatus = 'SENT';
    console.log('SMS sent after case creation', {
      phone: data.phone,
      attempt,
      messageId: result?.messageId
    });
  } catch (err) {
    smsStatus = 'FAILED';
    console.error('SMS failed after case creation', {
      phone: data.phone,
      error: err.message
    });
  }

  await dynamo
    .update({
      TableName: `${TABLE_NAME_PREFIX}-cases`,
      Key: { userId: decoded.userId, id: item.id },
      UpdateExpression: 'SET sms_status = :status',
      ExpressionAttributeValues: {
        ':status': smsStatus
      }
    })
    .promise();

  return jsonResponse(201, {
    referenceNumber,
    smsStatus,
    smsProvider,
    maskedPhone,
    message: 'Case submitted successfully'
  });
};

exports.handler = async (event) => {
  if ((event.requestContext?.http?.method || event.httpMethod) === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: ''
    };
  }

  return handle(event);
};
