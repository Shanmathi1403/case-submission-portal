const { maskPhone } = require('../../utils/token');

const sendSms = async (to, message) => {
  console.log(`[MOCK SMS] To: ${maskPhone(to)}`);
  console.log(message);
  return { success: true };
};

module.exports = {
  sendSms
};
