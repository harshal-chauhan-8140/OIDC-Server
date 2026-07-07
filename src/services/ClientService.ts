import type { Repository } from 'typeorm';
import type { Logger } from 'winston';
import type { Client } from '../entities/Client';
import { randomBytes, randomUUID } from 'crypto';
import createHttpError from 'http-errors';

export default class ClientService {
  constructor(
    private clientRepository: Repository<Client>,
    private logger: Logger,
  ) {}

  async create(name: string, redirectURIs: string[]) {
    const clientId = randomUUID();
    const clientSecret = randomBytes(32).toString('base64url');

    try {
      const client = await this.clientRepository.save({
        name,
        redirectURIs,
        clientId,
        clientSecret,
      });

      return client;
    } catch {
      const customError = createHttpError(500, 'Failed to store data in database');
      throw customError;
    }
  }
}
