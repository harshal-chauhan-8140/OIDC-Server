import app from './app.js';
import { config } from './config/index.js';

function startServer() {
  app.listen(config.PORT, () => {
    console.info(`Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
}

startServer();
