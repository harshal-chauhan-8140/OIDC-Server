import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Client } from './entities/Client';
import { config } from './config';
import { Authorization } from './entities/Authorization';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.DB_HOST,
  port: Number(config.DB_PORT),
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: config.NODE_ENV !== 'production',
  logging: false,
  entities: [User, Client, Authorization],
  migrations: [],
  subscribers: [],
});
