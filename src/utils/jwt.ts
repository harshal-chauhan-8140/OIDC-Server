import constants from './constants';
import { config } from '../config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function signJwt(id: number, name: string): string {
  return jwt.sign({ sub: String(id), name: name }, config.JWT_SECRET, {
    expiresIn: constants.JWT_EXPIRES_IN_SECONDS,
    issuer: config.SERVICE_NAME,
  });
}

export async function hash(value: string): Promise<string> {
  const hashedValue = await bcrypt.hash(value, constants.SALT_ROUNDS);
  return hashedValue;
}
