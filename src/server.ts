import app from './app.js';
import { config } from './config/index.js';
import logger from './config/logger.js';

function startServer() {
  app.listen(config.PORT, () => {
    logger.info(`Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
}

startServer();
