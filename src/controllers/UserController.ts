import type { Logger } from 'winston';
import type UserService from '../services/UserService';
import type { NextFunction, Response } from 'express';
import type { UserRegisterRequest } from '../types';
import { isHttpError } from 'http-errors';
import { buildAuthorizeQuery } from '../utils/authorizeQuery';

export default class UserController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async register(req: UserRegisterRequest, res: Response, next: NextFunction) {
    const { name, email, password } = req.body;
    const isAuthorizeFlow = Boolean(req.query.client_id);

    try {
      const user = await this.userService.create(name, email, password);

      if (user) {
        req.session.userId = user.id;

        if (isAuthorizeFlow) {
          return res.redirect(`/authorize?${buildAuthorizeQuery(req.query)}`);
        }

        return res.status(201).json({
          status: 'success',
          msg: 'user registered successfully.',
          id: user.id,
          name: user.name,
          email: user.email,
        });
      }
    } catch (error) {
      this.logger.error('Failed to register user', {
        email,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  async login(req: UserRegisterRequest, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    const isAuthorizeFlow = Boolean(req.query.client_id);

    let userId: number;
    try {
      userId = await this.userService.login(email, password);
    } catch (error) {
      if (isAuthorizeFlow && isHttpError(error) && error.statusCode === 404) {
        return res.redirect(`/register?${buildAuthorizeQuery(req.query)}`);
      }
      return next(error);
    }

    req.session.userId = userId;

    if (isAuthorizeFlow) {
      return res.redirect(`/authorize?${buildAuthorizeQuery(req.query)}`);
    }

    return res.status(200).json({
      status: 'success',
      msg: 'User logged in successfully',
    });
  }
}
