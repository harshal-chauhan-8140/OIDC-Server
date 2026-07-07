import type { Logger } from 'winston';
import type UserService from '../services/UserService';
import type { NextFunction, Response } from 'express';
import type { UserRegisterRequest } from '../types';

export default class UserController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async register(req: UserRegisterRequest, res: Response, next: NextFunction) {
    const { name, email, password } = req.body;

    try {
      const user = await this.userService.create(name, email, password);

      if (user) {
        return res.status(201).json({
          status: 'success',
          msg: 'user registered successfully.',
          id: user.id,
          name: user.name,
          email: user.email,
          accessToken: user.accessToken,
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
}
