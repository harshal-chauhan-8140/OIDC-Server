import crypto from 'crypto';
import { config } from '../config';

const privateKeyObject = crypto.createPrivateKey(config.OIDC_PRIVATE_KEY);

export const privateKeyPem = privateKeyObject.export({ type: 'pkcs8', format: 'pem' }).toString();

const publicKeyObject = crypto.createPublicKey(privateKeyPem);

export const publicKeyPem = publicKeyObject.export({ type: 'spki', format: 'pem' }).toString();

const publicJwk = publicKeyObject.export({ format: 'jwk' });

export const kid = crypto
  .createHash('sha256')
  .update(JSON.stringify({ e: publicJwk.e, kty: publicJwk.kty, n: publicJwk.n }))
  .digest('base64url');

export const jwks = {
  keys: [
    {
      ...publicJwk,
      kid,
      use: 'sig',
      alg: 'RS256',
    },
  ],
};
