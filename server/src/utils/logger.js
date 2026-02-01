const { maskPhone } = require('./token');

const sanitizeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const safeMeta = { ...meta };
  if (safeMeta.phone) {
    safeMeta.phone = maskPhone(safeMeta.phone);
  }
  return safeMeta;
};

const info = (message, meta) => {
  const safeMeta = sanitizeMeta(meta);
  if (safeMeta) {
    console.log(`[INFO] ${message}`, safeMeta);
    return;
  }
  console.log(`[INFO] ${message}`);
};

const error = (message, meta) => {
  const safeMeta = sanitizeMeta(meta);
  if (safeMeta) {
    console.error(`[ERROR] ${message}`, safeMeta);
    return;
  }
  console.error(`[ERROR] ${message}`);
};

module.exports = {
  info,
  error
};
