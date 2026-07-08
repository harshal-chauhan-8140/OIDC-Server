import express from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import logger from '../config/logger';
import OidcController from '../controllers/OidcController';
import OidcService from '../services/OidcService';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const oidcService = new OidcService(userRepository, logger);
const oidcController = new OidcController(oidcService, logger);

router.get(
  '/.well-known/openid-configuration',
  oidcController.openidConfiguration.bind(oidcController),
);
router.get('/.well-known/jwks.json', oidcController.jwks.bind(oidcController));
router.get('/userinfo', oidcController.userInfo.bind(oidcController));
router.post('/userinfo', oidcController.userInfo.bind(oidcController));

export default router;
