import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/entities/User';
import { Client } from '../../src/entities/Client';
import { Authorization } from '../../src/entities/Authorization';
import { config } from '../../src/config';
import { publicKeyPem } from '../../src/utils/keyStore';
import {
  GrantTypeSupported,
  ResponseTypeSupported,
  ScopeSupported,
} from '../../src/utils/constants';

describe('POST /authorize/token', () => {
  let connection: DataSource;

  const clientData = {
    name: 'Test Client',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectURIs: ['https://client.example.com/callback'],
    responseType: ResponseTypeSupported.CODE,
    grantTypeSupported: GrantTypeSupported.AUTHORIZATION_CODE,
    scopeSupported: [ScopeSupported.OPENID, ScopeSupported.EMAIL, ScopeSupported.PROFILE],
  };

  const userData = {
    name: 'testUser',
    email: 'user@example.com',
    password: 'secret123',
  };

  const validCode = 'valid-authorization-code';

  const validTokenBody = {
    grantType: GrantTypeSupported.AUTHORIZATION_CODE,
    code: validCode,
    redirectURI: clientData.redirectURIs[0],
    clientId: clientData.clientId,
    clientSecret: clientData.clientSecret,
  };

  const seed = async (authOverrides: Partial<Authorization> = {}) => {
    const client = await connection.getRepository(Client).save(clientData);
    const user = await connection.getRepository(User).save(userData);
    const authorization = await connection.getRepository(Authorization).save({
      code: validCode,
      client,
      user,
      redirectURI: clientData.redirectURIs[0],
      scope: [ScopeSupported.OPENID, ScopeSupported.EMAIL],
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
      ...authOverrides,
    });
    return { client, user, authorization };
  };

  const requestToken = (body: Record<string, unknown> = validTokenBody) =>
    request(app).post('/authorize/token').send(body);

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe('on success', () => {
    it('should return 200 with a standard token response', async () => {
      await seed();

      const response = await requestToken();

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        token_type: 'Bearer',
        expires_in: expect.any(Number),
      });
      expect(typeof response.body.access_token).toBe('string');
      expect(typeof response.body.id_token).toBe('string');
    });

    it('should issue an id token (RS256) with the correct claims', async () => {
      const { user } = await seed();

      const response = await requestToken();

      const decoded = jwt.verify(response.body.id_token, publicKeyPem) as jwt.JwtPayload;

      expect(decoded).toMatchObject({
        iss: config.ID_TOKEN_ISSUER,
        sub: String(user.id),
        aud: clientData.clientId,
        email: user.email,
      });
      // profile scope was not granted -> no name claim
      expect(decoded).not.toHaveProperty('name');
    });

    it('should issue a verifiable access token carrying the granted scope', async () => {
      const { user } = await seed();

      const response = await requestToken();

      const decoded = jwt.verify(response.body.access_token, publicKeyPem) as jwt.JwtPayload;

      expect(decoded.sub).toBe(String(user.id));
      expect(decoded.scope).toBe('openid email');
    });

    it('should include the name claim only when the profile scope was granted', async () => {
      const { user } = await seed({ scope: [ScopeSupported.OPENID, ScopeSupported.PROFILE] });

      const response = await requestToken();

      const decoded = jwt.verify(response.body.id_token, publicKeyPem) as jwt.JwtPayload;

      expect(decoded.name).toBe(user.name);
      expect(decoded).not.toHaveProperty('email');
    });

    it('should mark the authorization code as used', async () => {
      const { authorization } = await seed();

      await requestToken();

      const updated = await connection
        .getRepository(Authorization)
        .findOne({ where: { id: authorization.id } });

      expect(updated?.used).toBe(true);
    });

    it('should reject a second exchange of the same code (single-use)', async () => {
      await seed();

      const first = await requestToken();
      const second = await requestToken();

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(400);
    });
  });

  describe('validation failures', () => {
    it('should return 400 when the authorization code is missing', async () => {
      await seed();

      const response = await requestToken({ ...validTokenBody, code: '' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the client id is missing', async () => {
      await seed();

      const response = await requestToken({ ...validTokenBody, clientId: '' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the client does not exist', async () => {
      // nothing seeded -> client lookup fails
      const response = await requestToken();

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the client secret is incorrect', async () => {
      await seed();

      const response = await requestToken({ ...validTokenBody, clientSecret: 'wrong-secret' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the grant type is not allowed', async () => {
      await seed();

      const response = await requestToken({
        ...validTokenBody,
        grantType: GrantTypeSupported.REFRESH_TOKEN,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the authorization code does not exist', async () => {
      await seed();

      const response = await requestToken({ ...validTokenBody, code: 'non-existent-code' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the redirect uri does not match', async () => {
      await seed();

      const response = await requestToken({
        ...validTokenBody,
        redirectURI: 'https://attacker.example.com/callback',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the authorization code has expired', async () => {
      await seed({ expiresAt: new Date(Date.now() - 60 * 1000) });

      const response = await requestToken();

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the authorization code is already used', async () => {
      await seed({ used: true });

      const response = await requestToken();

      expect(response.statusCode).toBe(400);
    });
  });
});
