const sqlite3 = require('sqlite3').verbose();
const AWS = require('aws-sdk');
const env = require('../config/env');
const logger = require('../utils/logger');

let db;
let dynamo;
let useDynamoDB = false;

const initDb = () => {
  useDynamoDB = env.DATABASE_TYPE === 'dynamodb';

  if (useDynamoDB) {
    dynamo = new AWS.DynamoDB.DocumentClient();
    logger.info('Cases repository initialized with DynamoDB');
    return;
  }

  if (db) {
    return db;
  }

  db = new sqlite3.Database(env.DATABASE_PATH);

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        reference_number TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        sms_status TEXT NOT NULL DEFAULT 'PENDING',
        sms_provider TEXT NOT NULL DEFAULT 'mock',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT NOT NULL
      )`
    );
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id)'
    );
    // Migration: check if old column exists and migrate
    db.all('PRAGMA table_info(cases)', (err, rows) => {
      if (err) {
        logger.error('Failed to read cases table schema', { error: err.message });
        return;
      }
      const columns = new Set(rows.map((row) => row.name));
      if (!columns.has('sms_status')) {
        db.run("ALTER TABLE cases ADD COLUMN sms_status TEXT NOT NULL DEFAULT 'PENDING'");
      }
      if (!columns.has('sms_provider')) {
        db.run("ALTER TABLE cases ADD COLUMN sms_provider TEXT NOT NULL DEFAULT 'mock'");
      }
      if (!columns.has('user_id') && columns.has('owner_token_hash')) {
        db.run("ALTER TABLE cases ADD COLUMN user_id TEXT");
        logger.info('Added user_id column to cases table');
      }
    });
  });

  logger.info('Cases database initialized with SQLite');
  return db;
};

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function handleRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

const getNextReferenceNumber = async () => {
  if (useDynamoDB) {
    const year = new Date().getFullYear();
    const suffix = String(Date.now() % 10000).padStart(4, '0');
    return `CASE-${year}-${suffix}`;
  }

  const row = await get('SELECT COUNT(*) AS count FROM cases');
  const count = row ? row.count : 0;
  const year = new Date().getFullYear();
  return `CASE-${year}-${String(count + 1).padStart(4, '0')}`;
};

const insertCase = async ({
  id,
  referenceNumber,
  name,
  phone,
  title,
  description,
  userId,
  smsStatus,
  smsProvider
}) => {
  if (useDynamoDB) {
    const tableName = `${env.DYNAMODB_TABLE_PREFIX}-cases`;
    await dynamo
      .put({
        TableName: tableName,
        Item: {
          userId,
          id,
          reference_number: referenceNumber,
          name,
          phone,
          title,
          description,
          status: 'SUBMITTED',
          sms_status: smsStatus,
          sms_provider: smsProvider,
          created_at: new Date().toISOString()
        }
      })
      .promise();
    return;
  }

  await run(
    `INSERT INTO cases (id, reference_number, name, phone, title, description, user_id, sms_status, sms_provider)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      referenceNumber,
      name,
      phone,
      title,
      description,
      userId,
      smsStatus,
      smsProvider
    ]
  );
};

const updateSmsStatus = async (id, smsStatus) => {
  if (useDynamoDB) {
    // For DynamoDB, we need both userId and id to update
    // This is a limitation - we'd need to pass userId or do a scan
    logger.warn('updateSmsStatus not fully implemented for DynamoDB');
    return;
  }

  await run('UPDATE cases SET sms_status = ? WHERE id = ?', [smsStatus, id]);
};

const listCasesByUserId = async (userId) => {
  if (useDynamoDB) {
    const tableName = `${env.DYNAMODB_TABLE_PREFIX}-cases`;
    const result = await dynamo
      .query({
        TableName: tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      })
      .promise();

    return (result.Items || []).map((item) => ({
      id: item.id,
      referenceNumber: item.reference_number,
      title: item.title,
      status: item.status,
      smsStatus: item.sms_status,
      createdAt: item.created_at
    }));
  }

  return all(
    `SELECT id,
            reference_number AS referenceNumber,
            title,
            status,
            sms_status AS smsStatus,
            created_at AS createdAt
     FROM cases
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
};

module.exports = {
  initDb,
  getNextReferenceNumber,
  insertCase,
  updateSmsStatus,
  listCasesByUserId
};
