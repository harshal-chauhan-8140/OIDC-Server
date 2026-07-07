import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

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

  it('should return a JWT access token', async () => {
    const response = await registerUser();

    expect(response.body).toHaveProperty('accessToken');
    expect(typeof response.body.accessToken).toBe('string');
  });

  it('should issue a valid JWT that belongs to the registered user', async () => {
    const response = await registerUser();

    const users = await getSavedUsers();

    const decoded = jwt.verify(response.body.accessToken, config.JWT_SECRET) as {
      sub?: string;
    };

    expect(decoded.sub).toBe(String(users[0].id));
  });

  it('should not return the password in the response', async () => {
    const response = await registerUser();

    expect(response.body).not.toHaveProperty('password');
  });

  it('should return 400 when the email is already registered', async () => {
    await registerUser();
    const response = await registerUser();

    expect(response.statusCode).toBe(400);
  });
});
