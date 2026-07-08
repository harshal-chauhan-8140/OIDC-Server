import type { AuthorizeQueryData } from '../types';

export function buildAuthorizeQuery(query: Partial<AuthorizeQueryData>): string {
  const params = new URLSearchParams();
  const { client_id, response_type, redirect_URI, scope, state } = query;

  if (client_id) params.set('client_id', client_id);
  if (response_type) params.set('response_type', response_type);
  if (redirect_URI) params.set('redirect_URI', redirect_URI);
  if (scope) params.set('scope', scope);
  if (state) params.set('state', state);

  return params.toString();
}
