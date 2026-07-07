import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/data-source';
import { Client } from '../../src/entities/Client';

describe('POST /client/register', () => {
  let connection: DataSource;

  const clientRegisterData = {
    name: 'testApp',
    redirectURIs: ['http://localhost:3000'],
  };

  const registerClient = () => request(app).post('/client/register').send(clientRegisterData);

  const getSavedClients = () => connection.getRepository(Client).find();

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
    const response = await registerClient();

    expect(response.statusCode).toBe(201);
  });

  it('should persist the client in the database', async () => {
    await registerClient();

    const clients = await getSavedClients();

    expect(clients).toHaveLength(1);
  });

  it('should save the client with the correct name', async () => {
    await registerClient();

    const clients = await getSavedClients();

    expect(clients[0].name).toBe(clientRegisterData.name);
  });

  it('should save the client with the correct redirect URIs', async () => {
    await registerClient();

    const clients = await getSavedClients();

    expect(clients[0].redirectURIs).toEqual(clientRegisterData.redirectURIs);
  });

  it('should generate a clientId and clientSecret for the client', async () => {
    await registerClient();

    const clients = await getSavedClients();

    expect(clients[0]).toHaveProperty('clientId');
    expect(clients[0]).toHaveProperty('clientSecret');
  });
});
