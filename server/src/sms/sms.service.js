const env = require('../config/env');
const mockProvider = require('./providers/mock.provider');
const snsProvider = require('./providers/sns.provider');

const provider = env.SMS_PROVIDER === 'sns' ? snsProvider : mockProvider;
const providerName = env.SMS_PROVIDER === 'sns' ? 'SNS' : 'MOCK';

const sendSms = (to, message) => provider.sendSms(to, message);

module.exports = {
  sendSms,
  providerName
};
