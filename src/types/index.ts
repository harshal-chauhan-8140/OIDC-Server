import type { Request } from 'express';

export interface ClientRegisterData {
  name: string;
  redirectURIs: [string];
}

export interface ClientRegisterRequest extends Request {
  body: ClientRegisterData;
}

export interface UserRegisterData {
  name: string;
  email: string;
  password: string;
}

export interface UserRegisterRequest extends Request {
  body: UserRegisterData;
}
