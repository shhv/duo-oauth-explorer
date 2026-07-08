import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../', '.env') });

const required = (key) => {
  const val = process.env[key];
  if (!val) console.warn(`⚠ Missing env var: ${key}`);
  return val || '';
};

export const config = {
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',

  oidc: {
    issuer: required('OIDC_ISSUER'),
    clientId: required('OIDC_CLIENT_ID'),
    clientSecret: required('OIDC_CLIENT_SECRET'),
    authorizeUrl: required('OIDC_AUTHORIZE_URL'),
    tokenUrl: required('OIDC_TOKEN_URL'),
    userinfoUrl: required('OIDC_USERINFO_URL'),
    introspectUrl: required('OIDC_INTROSPECT_URL'),
    jwksUrl: process.env.OIDC_JWKS_URL || '',
    redirectUri: process.env.OIDC_REDIRECT_URI || 'http://localhost:3001/auth/callback/oidc',
  },

  oauth21: {
    issuer: required('OAUTH21_ISSUER'),
    clientId: required('OAUTH21_CLIENT_ID'),
    clientSecret: required('OAUTH21_CLIENT_SECRET'),
    authorizeUrl: required('OAUTH21_AUTHORIZE_URL'),
    tokenUrl: required('OAUTH21_TOKEN_URL'),
    userinfoUrl: required('OAUTH21_USERINFO_URL'),
    introspectUrl: required('OAUTH21_INTROSPECT_URL'),
    jwksUrl: process.env.OAUTH21_JWKS_URL || '',
    dcrUrl: process.env.OAUTH21_DCR_URL || '',
    redirectUri: process.env.OAUTH21_REDIRECT_URI || 'http://localhost:3001/auth/callback/oauth21',
    resource: process.env.OAUTH21_RESOURCE || 'http://localhost:3001',
  },
};

export function getIntegrationConfig(mode) {
  if (mode === 'oidc') return config.oidc;
  if (mode === 'oauth21') return config.oauth21;
  throw new Error(`Unknown mode: ${mode}`);
}
