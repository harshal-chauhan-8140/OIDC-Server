import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/entities/User';
import { Client } from '../../src/entities/Client';
import { Authorization } from '../../src/entities/Authorization';
import { hash } from '../../src/utils/bcryptHelper';
import {
  GrantTypeSupported,
  ResponseTypeSupported,
  ScopeSupported,
} from '../../src/utils/constants';

describe('POST /authorize', () => {
  let connection: DataSource;

  const userCredentials = {
    email: 'user@example.com',
    password: 'secret123',
  };

  const clientData = {
    name: 'Test Client',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectURIs: ['https://client.example.com/callback'],
    responseType: ResponseTypeSupported.CODE,
    grantTypeSupported: GrantTypeSupported.AUTHORIZATION_CODE,
    scopeSupported: [ScopeSupported.OPENID, ScopeSupported.EMAIL],
  };

  const validQuery = {
    client_id: clientData.clientId,
    response_type: ResponseTypeSupported.CODE,
    redirect_URI: clientData.redirectURIs[0],
    scope: 'openid email',
    state: 'xyz-state-123',
  };

  const seedUser = async () => {
    const hashedPassword = await hash(userCredentials.password);
    return connection.getRepository(User).save({
      name: 'testUser',
      email: userCredentials.email,
      password: hashedPassword,
    });
  };

  const seedClient = () => connection.getRepository(Client).save(clientData);

  const authenticatedAgent = async () => {
    await seedUser();
    const agent = request.agent(app);
    await agent.post('/auth/login').send(userCredentials);
    return agent;
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

  describe('when the user is not authenticated', () => {
    it('should redirect to the login page', async () => {
      const response = await request(app).post('/authorize').query(validQuery);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain('/login');
    });

    it('should not create an authorization record', async () => {
      await seedClient();

      await request(app).post('/authorize').query(validQuery);

      const authorizations = await connection.getRepository(Authorization).find();
      expect(authorizations).toHaveLength(0);
    });
  });

  describe('when the user is authenticated', () => {
    it('should redirect to the client redirectURI with an authorization code and state', async () => {
      const agent = await authenticatedAgent();
      await seedClient();

      const response = await agent.post('/authorize').query(validQuery);

      expect(response.statusCode).toBe(302);

      const location = new URL(response.headers.location);
      expect(`${location.origin}${location.pathname}`).toBe(clientData.redirectURIs[0]);
      expect(location.searchParams.get('code')).toBeTruthy();
      expect(location.searchParams.get('state')).toBe(validQuery.state);
    });

    it('should persist an authorization record with the issued code, client and user', async () => {
      const agent = await authenticatedAgent();
      const client = await seedClient();

      const response = await agent.post('/authorize').query(validQuery);

      const issuedCode = new URL(response.headers.location).searchParams.get('code');

      const authorizations = await connection
        .getRepository(Authorization)
        .find({ relations: { client: true, user: true } });

      expect(authorizations).toHaveLength(1);
      expect(authorizations[0].code).toBe(issuedCode);
      expect(authorizations[0].redirectURI).toBe(clientData.redirectURIs[0]);
      expect(authorizations[0].scope).toEqual([ScopeSupported.OPENID, ScopeSupported.EMAIL]);
      expect(authorizations[0].client.clientId).toBe(client.clientId);
      expect(authorizations[0].user.email).toBe(userCredentials.email);
    });

    it('should return 400 when the client_id does not exist', async () => {
      const agent = await authenticatedAgent();
      // no client seeded

      const response = await agent
        .post('/authorize')
        .query({ ...validQuery, client_id: 'unknown-client-id' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the response_type does not match the client', async () => {
      const agent = await authenticatedAgent();
      await seedClient();

      const response = await agent
        .post('/authorize')
        .query({ ...validQuery, response_type: 'token' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when the redirect_URI is not registered for the client', async () => {
      const agent = await authenticatedAgent();
      await seedClient();

      const response = await agent
        .post('/authorize')
        .query({ ...validQuery, redirect_URI: 'https://attacker.example.com/callback' });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when an unsupported scope is requested', async () => {
      const agent = await authenticatedAgent();
      await seedClient();

      const response = await agent
        .post('/authorize')
        .query({ ...validQuery, scope: 'openid profile' });

      expect(response.statusCode).toBe(400);
    });

    it('should not persist an authorization record when validation fails', async () => {
      const agent = await authenticatedAgent();
      await seedClient();

      await agent
        .post('/authorize')
        .query({ ...validQuery, redirect_URI: 'https://attacker.example.com/callback' });

      const authorizations = await connection.getRepository(Authorization).find();
      expect(authorizations).toHaveLength(0);
    });
  });
});
