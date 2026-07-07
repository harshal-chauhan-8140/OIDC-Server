import type { Request } from 'express';

export interface ClientRegisterData {
  name: string;
  redirectURIs: [string];
}

export interface ClientRegisterRequest extends Request {
  body: ClientRegisterData;
}
