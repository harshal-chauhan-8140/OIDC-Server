import type { Logger } from 'winston';
import type { Response, NextFunction } from 'express';
import type AuthorizationService from '../services/AuthorizationService';
import type { AuthorizeRequest, TokenVerficationRequest } from '../types';
import { buildAuthorizeQuery } from '../utils/authorizeQuery';

export class AuthorizationController {
  constructor(
    private authorizationService: AuthorizationService,
    private logger: Logger,
  ) {}

  async authorization(req: AuthorizeRequest, res: Response, next: NextFunction) {
    const {
      client_id: clientId,
      response_type: responseType,
      redirect_URI: redirectURI,
      scope,
      state,
      nonce,
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
        nonce,
      );
    } catch (error) {
      return next(error);
    }

    return res.redirect(`${redirectURI}?code=${code}&state=${state}`);
  }

  async token(req: TokenVerficationRequest, res: Response, next: NextFunction) {
    const { grantType, code, redirectURI, clientId, clientSecret } = req.body;

    try {
      const { idToken, accessToken, expiresIn } = await this.authorizationService.tokenVerify(
        grantType,
        code,
        redirectURI,
        clientId,
        clientSecret,
      );

      return res.status(200).json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        id_token: idToken,
      });
    } catch (error) {
      return next(error);
    }
  }
}
