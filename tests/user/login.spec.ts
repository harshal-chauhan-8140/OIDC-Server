import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/entities/User';
import { hash } from '../../src/utils/bcryptHelper';

describe('POST /auth/login', () => {
  let connection: DataSource;

  const userCredentials = {
    email: 'test@example.com',
    password: 'secret123',
  };

  const seedUser = async () => {
    const hashedPassword = await hash(userCredentials.password);
    return connection.getRepository(User).save({
      name: 'testUser',
      email: userCredentials.email,
      password: hashedPassword,
    });
  };

  const login = (credentials: { email: string; password: string } = userCredentials) =>
    request(app).post('/auth/login').send(credentials);

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

  it('should return 200 status code on successful login', async () => {
    await seedUser();

    const response = await login();

    expect(response.statusCode).toBe(200);
  });

  it('should return a success message on successful login', async () => {
    await seedUser();

    const response = await login();

    expect(response.body).toMatchObject({
      status: 'success',
      msg: 'User logged in successfully',
    });
  });

  it('should start a stateful session by setting a session cookie', async () => {
    await seedUser();

    const response = await login();

    const cookies = (response.headers['set-cookie'] ?? []) as unknown as string[];

    expect(cookies.some((cookie) => cookie.startsWith('connect.sid='))).toBe(true);
  });

  it('should set the session cookie as HttpOnly', async () => {
    await seedUser();

    const response = await login();

    const cookies = (response.headers['set-cookie'] ?? []) as unknown as string[];
    const sessionCookie = cookies.find((cookie) => cookie.startsWith('connect.sid='));

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toEqual(expect.stringContaining('HttpOnly'));
  });

  it('should not return the password in the response', async () => {
    await seedUser();

    const response = await login();

    expect(response.body).not.toHaveProperty('password');
  });

  it('should return 404 when the email is not registered', async () => {
    const response = await login({
      email: 'unknown@example.com',
      password: 'secret123',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when the password is incorrect', async () => {
    await seedUser();

    const response = await login({
      email: userCredentials.email,
      password: 'wrongPassword',
    });

    expect(response.statusCode).toBe(400);
  });

  describe('when part of the authorize flow (query params present)', () => {
    const authorizeQuery = {
      client_id: 'test-client-id',
      response_type: 'code',
      redirect_URI: 'https://client.example.com/callback',
      scope: 'openid email',
      state: 'xyz-state-123',
    };

    it('should redirect to /authorize with the same query params after a successful login', async () => {
      await seedUser();

      const response = await request(app)
        .post('/auth/login')
        .query(authorizeQuery)
        .send(userCredentials);

      expect(response.statusCode).toBe(302);

      const location = new URL(response.headers.location, 'http://localhost');
      expect(location.pathname).toBe('/authorize');
      expect(location.searchParams.get('client_id')).toBe(authorizeQuery.client_id);
      expect(location.searchParams.get('response_type')).toBe(authorizeQuery.response_type);
      expect(location.searchParams.get('redirect_URI')).toBe(authorizeQuery.redirect_URI);
      expect(location.searchParams.get('scope')).toBe(authorizeQuery.scope);
      expect(location.searchParams.get('state')).toBe(authorizeQuery.state);
    });

    it('should redirect an unregistered user to /register with the same query params', async () => {
      const response = await request(app)
        .post('/auth/login')
        .query(authorizeQuery)
        .send({ email: 'unknown@example.com', password: 'secret123' });

      expect(response.statusCode).toBe(302);

      const location = new URL(response.headers.location, 'http://localhost');
      expect(location.pathname).toBe('/register');
      expect(location.searchParams.get('client_id')).toBe(authorizeQuery.client_id);
      expect(location.searchParams.get('redirect_URI')).toBe(authorizeQuery.redirect_URI);
      expect(location.searchParams.get('scope')).toBe(authorizeQuery.scope);
      expect(location.searchParams.get('state')).toBe(authorizeQuery.state);
    });

    it('should still return 400 for an incorrect password instead of redirecting', async () => {
      await seedUser();

      const response = await request(app)
        .post('/auth/login')
        .query(authorizeQuery)
        .send({ email: userCredentials.email, password: 'wrongPassword' });

      expect(response.statusCode).toBe(400);
    });
  });
});
