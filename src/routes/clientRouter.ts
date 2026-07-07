import express from 'express';
import ClientController from '../controllers/ClientController';
import ClientService from '../services/ClientService';
import { AppDataSource } from '../data-source';
import { Client } from '../entities/Client';
import logger from '../config/logger';

const router = express.Router();

const clientRepository = AppDataSource.getRepository(Client);
const clientService = new ClientService(clientRepository, logger);
const clientController = new ClientController(clientService, logger);

router.post('/register', clientController.register.bind(clientController));

export default router;
