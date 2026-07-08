import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/entities/User';
import bcrypt from 'bcryptjs';

describe('POST /auth/register', () => {
  let connection: DataSource;

  const userRegisterData = {
    name: 'testUser',
    email: 'test@example.com',
    password: 'secret123',
  };

  const registerUser = () => request(app).post('/auth/register').send(userRegisterData);

  const getSavedUsers = () => connection.getRepository(User).find();

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

  it('should return 201 status code', async () => {
    const response = await registerUser();

    expect(response.statusCode).toBe(201);
  });

  it('should persist the user in the database', async () => {
    await registerUser();

    const users = await getSavedUsers();

    expect(users).toHaveLength(1);
  });

  it('should save the user with the correct name', async () => {
    await registerUser();

    const users = await getSavedUsers();

    expect(users[0].name).toBe(userRegisterData.name);
  });

  it('should save the user with the correct email', async () => {
    await registerUser();

    const users = await getSavedUsers();

    expect(users[0].email).toBe(userRegisterData.email);
  });

  it('should store the password as a hash, not as plaintext', async () => {
    await registerUser();

    const users = await getSavedUsers();

    expect(users[0].password).not.toBe(userRegisterData.password);

    const isPasswordHashed = await bcrypt.compare(userRegisterData.password, users[0].password);
    expect(isPasswordHashed).toBe(true);
  });

  it('should not return the password in the response', async () => {
    const response = await registerUser();

    expect(response.body).not.toHaveProperty('password');
  });

  it('should start a stateful session by setting a session cookie', async () => {
    const response = await registerUser();

    const cookies = (response.headers['set-cookie'] ?? []) as unknown as string[];

    expect(cookies.some((cookie) => cookie.startsWith('connect.sid='))).toBe(true);
  });

  it('should set the session cookie as HttpOnly', async () => {
    const response = await registerUser();

    const cookies = (response.headers['set-cookie'] ?? []) as unknown as string[];
    const sessionCookie = cookies.find((cookie) => cookie.startsWith('connect.sid='));

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toEqual(expect.stringContaining('HttpOnly'));
  });

  it('should return 400 when the email is already registered', async () => {
    await registerUser();
    const response = await registerUser();

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

    it('should redirect to /authorize with the same query params after registering', async () => {
      const response = await request(app)
        .post('/auth/register')
        .query(authorizeQuery)
        .send(userRegisterData);

      expect(response.statusCode).toBe(302);

      const location = new URL(response.headers.location, 'http://localhost');
      expect(location.pathname).toBe('/authorize');
      expect(location.searchParams.get('client_id')).toBe(authorizeQuery.client_id);
      expect(location.searchParams.get('response_type')).toBe(authorizeQuery.response_type);
      expect(location.searchParams.get('redirect_URI')).toBe(authorizeQuery.redirect_URI);
      expect(location.searchParams.get('scope')).toBe(authorizeQuery.scope);
      expect(location.searchParams.get('state')).toBe(authorizeQuery.state);
    });

    it('should still persist the user when registering within the authorize flow', async () => {
      await request(app).post('/auth/register').query(authorizeQuery).send(userRegisterData);

      const users = await getSavedUsers();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userRegisterData.email);
    });
  });
});
