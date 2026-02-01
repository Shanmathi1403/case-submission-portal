const AWS = require('aws-sdk');
const { validateCaseInput } = require('./cases/cases.validation');
const smsService = require('./sms/sms.service');
const {
  generateViewerToken,
  hashViewerToken,
  maskPhone
} = require('./utils/token');

const dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'cases';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

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

const buildReferenceNumber = () => {
  const year = new Date().getFullYear();
  const suffix = String(Date.now() % 10000).padStart(4, '0');
  return `CASE-${year}-${suffix}`;
};

const handleCreateCase = async (event) => {
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf-8')
    : event.body || '';

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return jsonResponse(400, { message: 'Invalid JSON body' });
  }

  let data;
  try {
    data = validateCaseInput(payload);
  } catch (err) {
    return jsonResponse(err.status || 400, {
      message: err.message || 'Invalid request payload',
      details: err.details
    });
  }

  const existingToken = getBearerToken(event.headers || {});
  const viewerToken = existingToken || generateViewerToken();
  const ownerTokenHash = hashViewerToken(viewerToken);
  const referenceNumber = buildReferenceNumber();
  const createdAt = Date.now();
  const smsProvider = smsService.providerName;
  const maskedPhone = maskPhone(data.phone);

  const item = {
    ownerTokenHash,
    createdAt,
    id: AWS.util.uuid.v4(),
    referenceNumber,
    name: data.name,
    phone: data.phone,
    title: data.title,
    description: data.description,
    status: 'SUBMITTED',
    smsStatus: 'PENDING',
    smsProvider
  };

  await dynamo
    .put({
      TableName: TABLE_NAME,
      Item: item
    })
    .promise();

  const message =
    'Your case {{referenceNumber}} has been successfully submitted. We will contact you if further details are required.';

  let smsStatus = 'PENDING';
  try {
    await smsService.sendSms(data.phone, message.replace('{{referenceNumber}}', referenceNumber));
    smsStatus = 'SENT';
  } catch (err) {
    smsStatus = 'FAILED';
  }

  await dynamo
    .update({
      TableName: TABLE_NAME,
      Key: { ownerTokenHash, createdAt },
      UpdateExpression: 'SET smsStatus = :status',
      ExpressionAttributeValues: {
        ':status': smsStatus
      }
    })
    .promise();

  return jsonResponse(201, {
    referenceNumber,
    viewerToken,
    smsStatus,
    smsProvider,
    maskedPhone,
    message: 'Case submitted successfully'
  });
};

const handleListCases = async (event) => {
  const viewerToken = getBearerToken(event.headers || {});
  if (!viewerToken) {
    return jsonResponse(401, { message: 'Authorization token required' });
  }

  const ownerTokenHash = hashViewerToken(viewerToken);

  const result = await dynamo
    .query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'ownerTokenHash = :hash',
      ExpressionAttributeValues: {
        ':hash': ownerTokenHash
      },
      ScanIndexForward: false
    })
    .promise();

  const cases = (result.Items || []).map((item) => ({
    id: item.id,
    referenceNumber: item.referenceNumber,
    title: item.title,
    status: item.status,
    smsStatus: item.smsStatus,
    createdAt: new Date(item.createdAt).toISOString()
  }));

  return jsonResponse(200, { cases });
};

exports.handler = async (event) => {
  return jsonResponse(410, { message: 'Use route-specific handlers.' });
};
