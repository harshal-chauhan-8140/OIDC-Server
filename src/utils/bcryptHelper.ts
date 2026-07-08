import constants from './constants';
import bcrypt from 'bcryptjs';

export async function hash(value: string): Promise<string> {
  const hashedValue = await bcrypt.hash(value, constants.SALT_ROUNDS);
  return hashedValue;
}

export async function validatePassword(passwordHash: string, password: string) {
  return await bcrypt.compare(password, passwordHash);
}
