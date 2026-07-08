import type { Request } from 'express';

export interface ClientRegisterData {
  name: string;
  redirectURIs: [string];
}

export interface AuthorizeQueryData {
  client_id: string;
  response_type: string;
  redirect_URI: string;
  scope: string;
  state?: string;
  nonce?: string;
}

export interface ClientRegisterRequest extends Request {
  body: ClientRegisterData;
}

export type AuthorizeRequest = Request<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  AuthorizeQueryData
>;

export interface UserRegisterData {
  name: string;
  email: string;
  password: string;
}

export type UserRegisterRequest = Request<
  Record<string, never>,
  Record<string, never>,
  UserRegisterData,
  Partial<AuthorizeQueryData>
>;

export interface UserScopeData {
  email?: string;
  name?: string;
}

export interface UserInfoClaims {
  sub: string;
  email?: string;
  name?: string;
}

export interface TokenVerificationData {
  grantType: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectURI: string;
}

export interface TokenVerficationRequest extends Request {
  body: TokenVerificationData;
}
