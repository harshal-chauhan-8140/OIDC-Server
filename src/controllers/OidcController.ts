import type { Logger } from 'winston';
import type { Request, Response, NextFunction } from 'express';
import type OidcService from '../services/OidcService';
import createHttpError from 'http-errors';
import { config } from '../config';
import { GrantTypeSupported, ResponseTypeSupported, ScopeSupported } from '../utils/constants';
import { jwks } from '../utils/keyStore';

export default class OidcController {
  constructor(
    private oidcService: OidcService,
    private logger: Logger,
  ) {}

  openidConfiguration(req: Request, res: Response) {
    const issuer = config.ID_TOKEN_ISSUER;

    return res.status(200).json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/authorize/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      response_types_supported: Object.values(ResponseTypeSupported),
      grant_types_supported: Object.values(GrantTypeSupported),
      scopes_supported: Object.values(ScopeSupported),
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: ['client_secret_post'],
      claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'nonce', 'email', 'name'],
    });
  }

  jwks(req: Request, res: Response) {
    return res.status(200).json(jwks);
  }

  async userInfo(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createHttpError(401, 'missing or malformed authorization header'));
    }

    const accessToken = authHeader.slice('Bearer '.length).trim();

    try {
      const claims = await this.oidcService.getUserInfo(accessToken);

      return res.status(200).json(claims);
    } catch (error) {
      return next(error);
    }
  }
}
