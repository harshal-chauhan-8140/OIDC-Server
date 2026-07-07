import type { Logger } from 'winston';
import type ClientService from '../services/ClientService';
import type { NextFunction, Response } from 'express';
import type { ClientRegisterRequest } from '../types';

export default class ClientController {
  constructor(
    private clientService: ClientService,
    private logger: Logger,
  ) {}

  async register(req: ClientRegisterRequest, res: Response, next: NextFunction) {
    const { name, redirectURIs } = req.body;

    try {
      const clientData = await this.clientService.create(name, redirectURIs);

      if (clientData) {
        return res.status(201).json({
          status: 'success',
          msg: 'client registered successfully.',
          name: clientData.name,
          redirectURIs: clientData.redirectURIs,
          clientId: clientData.clientId,
          clientSecret: clientData.clientSecret,
        });
      }
    } catch (error) {
      this.logger.error('Failed to register client', {
        name,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
