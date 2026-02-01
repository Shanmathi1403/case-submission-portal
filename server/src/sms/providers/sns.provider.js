const AWS = require('aws-sdk');
const env = require('../../config/env');

const sns = new AWS.SNS();
const SNS_PROVIDER_VERSION = '2026-01-31';

const sendSms = async (to, message) => {
  console.log('SNS provider version', SNS_PROVIDER_VERSION);
  const params = {
    Message: message,
    PhoneNumber: to,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: env.SNS_SMS_TYPE || 'Transactional'
      }
    }
  };

  if (env.SNS_SENDER_ID) {
    params.MessageAttributes['AWS.SNS.SMS.SenderID'] = {
      DataType: 'String',
      StringValue: env.SNS_SENDER_ID
    };
  }

  if (env.SNS_ORIGINATION_NUMBER) {
    params.MessageAttributes['AWS.MM.SMS.OriginationNumber'] = {
      DataType: 'String',
      StringValue: env.SNS_ORIGINATION_NUMBER
    };
  }

  const result = await sns.publish(params).promise();
  return {
    success: true,
    messageId: result.MessageId
  };
};

module.exports = {
  sendSms
};
