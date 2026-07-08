import express from 'express';
import { AppDataSource } from '../data-source';
import { Client } from '../entities/Client';
import logger from '../config/logger';
import { User } from '../entities/User';
import { Authorization } from '../entities/Authorization';
import { AuthorizationController } from '../controllers/AuthorizationController';
import AuthorizationService from '../services/AuthorizationService';

const router = express.Router();

const clientRepository = AppDataSource.getRepository(Client);
const userRepository = AppDataSource.getRepository(User);
const authoizationRepository = AppDataSource.getRepository(Authorization);
const authorizationService = new AuthorizationService(
  userRepository,
  clientRepository,
  authoizationRepository,
  logger,
);
const authoziationController = new AuthorizationController(authorizationService, logger);

router.post('/', authoziationController.authorizate.bind(authoziationController));

export default router;
