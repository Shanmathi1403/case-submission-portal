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
    logger.info('Users repository initialized with DynamoDB');
    return;
  }

  if (db) {
    return db;
  }

  db = new sqlite3.Database(env.DATABASE_PATH);

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)'
    );
    
    // Migration: Add phone column if it doesn't exist
    db.all("PRAGMA table_info(users)", [], (err, columns) => {
      if (err) return;
      const hasPhone = columns.some(col => col.name === 'phone');
      if (!hasPhone) {
        db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {
          if (err) logger.error('Failed to add phone column:', err);
          else logger.info('Added phone column to users table');
        });
      }
    });
  });

  logger.info('Users database initialized with SQLite');
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

const insertUser = async ({ id, username, passwordHash, phone }) => {
  if (useDynamoDB) {
    const tableName = `${env.DYNAMODB_TABLE_PREFIX}-users`;
    await dynamo
      .put({
        TableName: tableName,
        Item: {
          username,
          id,
          password_hash: passwordHash,
          phone: phone || null,
          created_at: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(username)'
      })
      .promise();
    return;
  }

  await run(
    'INSERT INTO users (id, username, password_hash, phone) VALUES (?, ?, ?, ?)',
    [id, username, passwordHash, phone || null]
  );
};

const getUserByUsername = async (username) => {
  if (useDynamoDB) {
    const tableName = `${env.DYNAMODB_TABLE_PREFIX}-users`;
    const result = await dynamo
      .get({
        TableName: tableName,
        Key: { username }
      })
      .promise();
    return result.Item;
  }

  const row = await get('SELECT * FROM users WHERE username = ?', [username]);
  return row;
};

const getUserById = async (id) => {
  if (useDynamoDB) {
    const tableName = `${env.DYNAMODB_TABLE_PREFIX}-users`;
    const result = await dynamo
      .query({
        TableName: tableName,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id
        }
      })
      .promise();
    return result.Items?.[0];
  }

  const row = await get('SELECT * FROM users WHERE id = ?', [id]);
  return row;
};

module.exports = {
  initDb,
  insertUser,
  getUserByUsername,
  getUserById
};
