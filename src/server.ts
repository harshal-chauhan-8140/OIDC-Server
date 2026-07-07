import app from './app';
import { config } from './config/index';
import logger from './config/logger';

function startServer() {
  app.listen(config.PORT, () => {
    logger.info(`Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
}

startServer();
