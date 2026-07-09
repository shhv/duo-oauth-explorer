import { getIntegrationConfig } from '../config.js';

export async function exchangeCode(mode, code, codeVerifier, opts = {}) {
  const cfg = getIntegrationConfig(mode);
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.redirectUri,
    client_id: opts.clientId || cfg.clientId,
    code_verifier: codeVerifier,
  });

  if (!opts.pkceOnly) {
    params.set('client_secret', cfg.clientSecret);
  }

  if (cfg.resource) {
    params.set('resource', cfg.resource);
  }

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function refreshTokens(mode, refreshToken) {
  const cfg = getIntegrationConfig(mode);
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function introspectToken(mode, token) {
  const cfg = getIntegrationConfig(mode);
  const params = new URLSearchParams({
    token,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });

  const res = await fetch(cfg.introspectUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Introspection failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function fetchUserInfo(mode, accessToken) {
  const cfg = getIntegrationConfig(mode);
  const res = await fetch(cfg.userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UserInfo failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function clientCredentialsGrant(clientId, clientSecret) {
  const { config } = await import('../config.js');
  const cfg = config.oauth21;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId || cfg.clientId,
    client_secret: clientSecret || cfg.clientSecret,
  });
  if (cfg.resource) {
    params.set('resource', cfg.resource);
  }

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Client credentials failed (${res.status}): ${text}`);
  }
  return res.json();
}
