import type { Repository } from 'typeorm';
import type { Authorization } from '../entities/Authorization';
import type { Logger } from 'winston';
import type { User } from '../entities/User';
import type { Client } from '../entities/Client';
import createHttpError from 'http-errors';
import { ScopeSupported } from '../utils/constants';
import crypto from 'crypto';
import constants from '../utils/constants';
import type { UserScopeData } from '../types';
import { generateIdToken, generateAccessToken } from '../utils/jwtHelper';

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
    nonce?: string,
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

    if (!scopeArray.includes(ScopeSupported.OPENID)) {
      const customError = createHttpError(400, `openid scope is required`);
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
      ...(nonce !== undefined ? { nonce } : {}),
      expiresAt: new Date(Date.now() + constants.AUTHORIZATION_CODE_EXPIRES_MINUTE * 60 * 1000),
    });

    return code;
  }

  async tokenVerify(
    grantType: string,
    code: string,
    redirectURI: string,
    clientId: string,
    clientSecret: string,
  ) {
    if (!code || !clientId) {
      const customError = createHttpError(
        400,
        `${!code ? 'authorization code' : 'client id'} is missing.`,
      );
      throw customError;
    }

    const client = await this.clientRepository.findOne({
      where: { clientId: clientId },
    });

    if (!client) {
      const customError = createHttpError(400, `client does not exist with given client id.`);
      throw customError;
    }

    if (clientSecret !== client.clientSecret) {
      const customError = createHttpError(400, `client id or client secret is incorrect`);
      throw customError;
    }

    if (client.grantTypeSupported !== grantType) {
      const customError = createHttpError(400, `grant type not allowed.`);
      throw customError;
    }

    const authorization = await this.authorizationRepository.findOne({
      where: {
        code: code,
        client: { clientId: client.clientId },
      },
      relations: { user: true },
    });

    if (!authorization) {
      const customError = createHttpError(400, `authorization code does not exist`);
      throw customError;
    }

    if (authorization.redirectURI !== redirectURI) {
      const customError = createHttpError(400, `redirect uri does not match`);
      throw customError;
    }

    if (authorization.used) {
      const customError = createHttpError(400, `authorization code already used`);
      throw customError;
    }

    if (authorization.expiresAt.getTime() < Date.now()) {
      const customError = createHttpError(400, `authorization code already expired.`);
      throw customError;
    }

    const userScopeData: UserScopeData = {};

    if (authorization.scope.includes(ScopeSupported.EMAIL)) {
      userScopeData.email = authorization.user.email;
    }

    if (authorization.scope.includes(ScopeSupported.PROFILE)) {
      userScopeData.name = authorization.user.name;
    }

    const idToken = generateIdToken(
      authorization.user.id,
      clientId,
      userScopeData,
      authorization.nonce,
    );
    const accessToken = generateAccessToken(authorization.user.id, clientId, authorization.scope);

    await this.authorizationRepository.update(authorization.id, { used: true });

    return {
      idToken,
      accessToken,
      expiresIn: constants.ACCESS_TOKEN_EXPIRES_SECONDS,
    };
  }
}
