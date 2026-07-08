import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { config } from '../../src/config';
import { privateKeyPem, kid } from '../../src/utils/keyStore';

describe('OIDC discovery metadata', () => {
  describe('GET /.well-known/openid-configuration', () => {
    it('should return the provider metadata', async () => {
      const response = await request(app).get('/.well-known/openid-configuration');

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        issuer: config.ID_TOKEN_ISSUER,
        authorization_endpoint: `${config.ID_TOKEN_ISSUER}/authorize`,
        token_endpoint: `${config.ID_TOKEN_ISSUER}/authorize/token`,
        userinfo_endpoint: `${config.ID_TOKEN_ISSUER}/userinfo`,
        jwks_uri: `${config.ID_TOKEN_ISSUER}/.well-known/jwks.json`,
        id_token_signing_alg_values_supported: ['RS256'],
      });
      expect(response.body.response_types_supported).toContain('code');
      expect(response.body.scopes_supported).toEqual(
        expect.arrayContaining(['openid', 'email', 'profile']),
      );
    });
  });

  describe('GET /.well-known/jwks.json', () => {
    it('should publish the signing public key as a JWK', async () => {
      const response = await request(app).get('/.well-known/jwks.json');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.keys)).toBe(true);

      const key = response.body.keys[0];
      expect(key).toMatchObject({
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid,
      });
      expect(typeof key.n).toBe('string');
      expect(typeof key.e).toBe('string');
      // must not leak private key material
      expect(key).not.toHaveProperty('d');
    });

    it('should publish a key whose kid matches the signed token header', async () => {
      const response = await request(app).get('/.well-known/jwks.json');
      const jwksKid = response.body.keys[0].kid;

      const token = jwt.sign({ hello: 'world' }, privateKeyPem, {
        algorithm: 'RS256',
        keyid: kid,
      });
      const header = jwt.decode(token, { complete: true })?.header;

      expect(header?.kid).toBe(jwksKid);
    });
  });
});
