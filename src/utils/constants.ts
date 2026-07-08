const constants = {
  SALT_ROUNDS: 10,
  MAX_AGE_OF_COOKIE: 1000 * 60 * 60 * 24,
  AUTHORIZATION_CODE_EXPIRES_MINUTE: 15,
};

export enum ResponseTypeSupported {
  CODE = 'code',
}

export enum ScopeSupported {
  OPENID = 'openid',
  EMAIL = 'email',
  PROFILE = 'profile',
}

export enum GrantTypeSupported {
  AUTHORIZATION_CODE = 'authorization_code',
  REFRESH_TOKEN = 'refresh_token',
}

export default constants;
