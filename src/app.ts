import express, { type Request, type Response, type NextFunction } from 'express';
import logger from './config/logger';
import { HttpError } from 'http-errors';
import 'reflect-metadata';
import clientRouter from './routes/clientRouter';
import userRouter from './routes/userRouter';

const app = express();
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    msg: 'Server is running',
  });
});

app.use('/client', clientRouter);
app.use('/auth', userRouter);

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
