import type { Logger } from 'winston';
import type { Response, NextFunction } from 'express';
import type AuthorizationService from '../services/AuthorizationService';
import type { AuthorizeRequest } from '../types';
import { buildAuthorizeQuery } from '../utils/authorizeQuery';

export class AuthorizationController {
  constructor(
    private authorizationService: AuthorizationService,
    private logger: Logger,
  ) {}

  async authorizate(req: AuthorizeRequest, res: Response, next: NextFunction) {
    const {
      client_id: clientId,
      response_type: responseType,
      redirect_URI: redirectURI,
      scope,
      state,
    } = req.query;

    if (!req.session || !req.session.userId) {
      res.redirect(`/login?${buildAuthorizeQuery(req.query)}`);
      return;
    }

    const userId = req.session.userId;
    let code: string;
    try {
      code = await this.authorizationService.authorize(
        clientId,
        userId,
        responseType,
        redirectURI,
        scope,
        state,
      );
    } catch (error) {
      return next(error);
    }

    return res.redirect(`${redirectURI}?code=${code}&state=${state}`);
  }
}
