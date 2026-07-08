import type { Repository } from 'typeorm';
import type { Authorization } from '../entities/Authorization';
import type { Logger } from 'winston';
import type { User } from '../entities/User';
import type { Client } from '../entities/Client';
import createHttpError from 'http-errors';
import type { ScopeSupported } from '../utils/constants';
import crypto from 'crypto';
import constants from '../utils/constants';

export default class AuthorizationService {
  constructor(
    private userRepository: Repository<User>,
    private clientRepository: Repository<Client>,
    private authorizationRepository: Repository<Authorization>,
    private logger: Logger,
  ) {}

  async authorize(
    clientId: string,
    userId: number,
    responseType: string,
    redirectURI: string,
    scope: string,
    state?: string,
  ) {
    const client: Client | null = await this.clientRepository.findOne({
      where: { clientId: clientId },
    });

    if (!client) {
      const customError = createHttpError(400, `client id: ${clientId} does not exist`);
      throw customError;
    }

    const user: User | null = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      const customError = createHttpError(400, `User does not exist`);
      throw customError;
    }

    if (client.responseType !== responseType) {
      const customError = createHttpError(400, `Invalid response type requested`);
      throw customError;
    }

    if (!client.redirectURIs.includes(redirectURI)) {
      const customError = createHttpError(400, `redirectURI not allowed`);
      throw customError;
    }

    const scopeArray = [
      ...new Set(scope.split(' ').filter((word) => word.trim() !== '')),
    ] as ScopeSupported[];
    const isValidScope = scopeArray.every((scope) => client.scopeSupported.includes(scope));

    if (!isValidScope) {
      const customError = createHttpError(400, `Invalid scope requested`);
      throw customError;
    }

    const code = crypto.randomBytes(64).toString('hex');

    await this.authorizationRepository.save({
      client: client,
      user: user,
      code: code,
      redirectURI: redirectURI,
      scope: scopeArray,
      ...(state !== undefined ? { state } : {}),
      expiresAt: new Date(Date.now() + constants.AUTHORIZATION_CODE_EXPIRES_MINUTE * 60 * 1000),
    });

    return code;
  }
}
