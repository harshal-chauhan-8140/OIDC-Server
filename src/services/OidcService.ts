import type { Repository } from 'typeorm';
import type { Logger } from 'winston';
import type { User } from '../entities/User';
import type { UserInfoClaims } from '../types';
import createHttpError from 'http-errors';
import { ScopeSupported } from '../utils/constants';
import { verifyToken } from '../utils/jwtHelper';

export default class OidcService {
  constructor(
    private userRepository: Repository<User>,
    private logger: Logger,
  ) {}

  async getUserInfo(accessToken: string) {
    let payload;
    try {
      payload = verifyToken(accessToken);
    } catch {
      throw createHttpError(401, 'invalid or expired access token');
    }

    const userId = Number(payload.sub);
    const grantedScopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw createHttpError(401, 'user not found');
    }

    const claims: UserInfoClaims = { sub: String(user.id) };

    if (grantedScopes.includes(ScopeSupported.EMAIL)) {
      claims.email = user.email;
    }

    if (grantedScopes.includes(ScopeSupported.PROFILE)) {
      claims.name = user.name;
    }

    return claims;
  }
}
