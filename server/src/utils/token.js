const crypto = require('crypto');

const generateViewerToken = () => crypto.randomBytes(32).toString('hex');

const hashViewerToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const maskPhone = (phone) => {
  if (!phone) {
    return '';
  }

  const trimmed = String(phone);
  if (trimmed.length <= 4) {
    return '****';
  }

  const prefixLength = Math.min(3, Math.max(1, trimmed.length - 4));
  const prefix = trimmed.slice(0, prefixLength);
  const suffix = trimmed.slice(-4);
  return `${prefix}****${suffix}`;
};

module.exports = {
  generateViewerToken,
  hashViewerToken,
  maskPhone
};
