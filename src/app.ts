import express, { type Request, type Response, type NextFunction } from 'express';
import logger from './config/logger';
import { HttpError } from 'http-errors';
import 'reflect-metadata';
import clientRouter from './routes/clientRouter';
import userRouter from './routes/userRouter';
import authorizeRouter from './routes/AuthorizeRouter';
import session from 'express-session';
import { config } from './config';
import constants from './utils/constants';

const app = express();

app.use(express.json());
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: constants.MAX_AGE_OF_COOKIE,
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'none',
    },
  }),
);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    msg: 'Server is running',
  });
});

app.use('/client', clientRouter);
app.use('/auth', userRouter);
app.use('/authorize', authorizeRouter);

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
