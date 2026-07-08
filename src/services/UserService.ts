import type { Repository } from 'typeorm';
import type { Logger } from 'winston';
import type { User } from '../entities/User';
import createHttpError from 'http-errors';
import { hash, validatePassword } from '../utils/bcryptHelper';

export default class UserService {
  constructor(
    private userRepository: Repository<User>,
    private logger: Logger,
  ) {}

  async create(name: string, email: string, password: string) {
    const existingUser = await this.userRepository.findOne({ where: { email } });

    if (existingUser) {
      const customError = createHttpError(400, 'Email is already registered');
      throw customError;
    }

    const hashedPassword = await hash(password);

    try {
      const user = await this.userRepository.save({
        name,
        email,
        password: hashedPassword,
      });

      return user;
    } catch {
      const customError = createHttpError(500, 'Failed to store data in database');
      throw customError;
    }
  }

  async login(email: string, password: string) {
    const existingUser = await this.userRepository.findOne({ where: { email } });

    if (!existingUser) {
      const customError = createHttpError(404, 'User is not registered');
      throw customError;
    }

    const isPasswordMatched = await validatePassword(existingUser.password, password);

    if (!isPasswordMatched) {
      const customError = createHttpError(400, 'Incorrect email or password');
      throw customError;
    }

    return existingUser.id;
  }
}
