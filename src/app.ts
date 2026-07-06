import express, { type Request, type Response, type NextFunction } from 'express';
import logger from './config/logger.js';
import { HttpError } from 'http-errors';

const app = express();

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    msg: 'Server is running',
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    errors: [
      {
        type: err.name,
        msg: err.message,
        path: '',
        location: '',
      },
    ],
  });
});

export default app;
