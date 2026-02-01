const app = require('./app');
const env = require('./config/env');
const { initDb } = require('./cases/cases.repository');
const logger = require('./utils/logger');

initDb();

app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
});
