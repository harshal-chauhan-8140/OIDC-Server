import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/entities/User';
import { Client } from '../../src/entities/Client';
import { Authorization } from '../../src/entities/Authorization';
import {
  GrantTypeSupported,
  ResponseTypeSupported,
  ScopeSupported,
} from '../../src/utils/constants';

describe('GET /userinfo', () => {
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

  const tokenBody = {
    grantType: GrantTypeSupported.AUTHORIZATION_CODE,
    code: validCode,
    redirectURI: clientData.redirectURIs[0],
    clientId: clientData.clientId,
    clientSecret: clientData.clientSecret,
  };

  // Seeds a client/user/authorization for `scope`, exchanges the code and
  // returns the issued access token plus the persisted user.
  const seedAndGetAccessToken = async (
    scope: ScopeSupported[] = [ScopeSupported.OPENID, ScopeSupported.EMAIL, ScopeSupported.PROFILE],
  ) => {
    const client = await connection.getRepository(Client).save(clientData);
    const user = await connection.getRepository(User).save(userData);
    await connection.getRepository(Authorization).save({
      code: validCode,
      client,
      user,
      redirectURI: clientData.redirectURIs[0],
      scope,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
    });

    const tokenResponse = await request(app).post('/authorize/token').send(tokenBody);
    return { user, accessToken: tokenResponse.body.access_token as string };
  };

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

  it('should return the subject and scoped claims for a valid access token', async () => {
    const { user, accessToken } = await seedAndGetAccessToken();

    const response = await request(app)
      .get('/userinfo')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });
  });

  it('should limit claims to the granted scope', async () => {
    const { user, accessToken } = await seedAndGetAccessToken([ScopeSupported.OPENID]);

    const response = await request(app)
      .get('/userinfo')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ sub: String(user.id) });
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('name');
  });

  it('should also support POST', async () => {
    const { user, accessToken } = await seedAndGetAccessToken();

    const response = await request(app)
      .post('/userinfo')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.sub).toBe(String(user.id));
  });

  it('should return 401 when the authorization header is missing', async () => {
    const response = await request(app).get('/userinfo');

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 when the bearer token is invalid', async () => {
    const response = await request(app)
      .get('/userinfo')
      .set('Authorization', 'Bearer not-a-valid-token');

    expect(response.statusCode).toBe(401);
  });
});
