const { v4: uuidv4 } = require('uuid');
const repository = require('./cases.repository');
const smsService = require('../sms/sms.service');
const { maskPhone } = require('../utils/token');
const logger = require('../utils/logger');

const SMS_TEMPLATE =
  'Your case {{referenceNumber}} has been successfully submitted. We will contact you if further details are required.';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendSmsWithRetry = async (phone, message, attempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await smsService.sendSms(phone, message);
      return attempt;
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await sleep(500 * attempt);
      }
    }
  }

  throw lastError;
};

const createCase = async ({ name, phone, title, description }, userId) => {
  const referenceNumber = await repository.getNextReferenceNumber();
  const smsProvider = smsService.providerName;
  const maskedPhone = maskPhone(phone);

  const id = uuidv4();
  await repository.insertCase({
    id,
    referenceNumber,
    name,
    phone,
    title,
    description,
    userId,
    smsStatus: 'PENDING',
    smsProvider
  });

  const message = SMS_TEMPLATE.replace('{{referenceNumber}}', referenceNumber);
  let smsStatus = 'PENDING';
  try {
    await sendSmsWithRetry(phone, message);
    smsStatus = 'SENT';
  } catch (err) {
    smsStatus = 'FAILED';
    logger.error('SMS failed after case creation', {
      phone,
      error: err.message
    });
  }

  try {
    await repository.updateSmsStatus(id, smsStatus);
  } catch (err) {
    logger.error('Failed to update SMS status', {
      error: err.message
    });
  }

  return {
    referenceNumber,
    smsStatus,
    smsProvider,
    maskedPhone
  };
};

const getCasesForUser = async (userId) => {
  const cases = await repository.listCasesByUserId(userId);
  return cases.map((item) => ({
    id: item.id,
    referenceNumber: item.referenceNumber,
    title: item.title,
    status: item.status,
    smsStatus: item.smsStatus,
    createdAt: item.createdAt
  }));
};

module.exports = {
  createCase,
  getCasesForUser
};
