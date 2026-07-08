import jwt from 'jsonwebtoken';
import { config } from '../config';
import constants from './constants';
import type { ScopeSupported } from './constants';
import { privateKeyPem, publicKeyPem, kid } from './keyStore';
import type { UserScopeData } from '../types';

export function generateIdToken(
  userId: number,
  clientId: string,
  userScopeData: UserScopeData,
  nonce?: string,
) {
  return jwt.sign(
    {
      email: userScopeData.email,
      name: userScopeData.name,
      ...(nonce ? { nonce } : {}),
    },
    privateKeyPem,
    {
      algorithm: 'RS256',
      keyid: kid,
      issuer: config.ID_TOKEN_ISSUER,
      subject: String(userId),
      audience: clientId,
      expiresIn: constants.ID_TOKEN_EXPIRES_SECONDS,
    },
  );
}

export function generateAccessToken(userId: number, clientId: string, scope: ScopeSupported[]) {
  return jwt.sign(
    {
      scope: scope.join(' '),
      token_use: 'access',
    },
    privateKeyPem,
    {
      algorithm: 'RS256',
      keyid: kid,
      issuer: config.ID_TOKEN_ISSUER,
      subject: String(userId),
      audience: clientId,
      expiresIn: constants.ACCESS_TOKEN_EXPIRES_SECONDS,
    },
  );
}

export function verifyToken(token: string): jwt.JwtPayload {
  const payload = jwt.verify(token, publicKeyPem, { algorithms: ['RS256'] });

  if (typeof payload === 'string') {
    throw new Error('Unexpected token payload');
  }

  return payload;
}
