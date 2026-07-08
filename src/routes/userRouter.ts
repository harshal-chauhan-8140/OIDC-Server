import express from 'express';
import UserController from '../controllers/UserController';
import UserService from '../services/UserService';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import logger from '../config/logger';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository, logger);
const userController = new UserController(userService, logger);

router.post('/register', userController.register.bind(userController));
router.post('/login', userController.login.bind(userController));

export default router;
