import { Router } from 'express';
import { config } from '../config.js';
import { clientCredentialsGrant } from '../utils/oauth.js';
import { decodeJwt } from '../utils/jwt.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const dcrRouter = Router();

dcrRouter.post('/dcr', requireAuth, async (req, res) => {
  if (req.session.mode !== 'oauth21') {
    return res.status(400).json({ error: 'DCR is only available in OAuth 2.1 mode' });
  }

  const { client_name, redirect_uris, grant_types } = req.body;
  const dcrUrl = config.oauth21.dcrUrl;
  if (!dcrUrl) {
    return res.status(400).json({ error: 'DCR URL not configured' });
  }

  try {
    const response = await fetch(dcrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.session.tokens.access_token}`,
      },
      body: JSON.stringify({
        client_name: client_name || 'DuoExplorer-Dynamic-Client',
        redirect_uris: redirect_uris || [config.oauth21.redirectUri],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DCR failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dcrRouter.post('/client-credentials', async (req, res) => {
  const { client_id, client_secret } = req.body;
  try {
    const tokenResponse = await clientCredentialsGrant(client_id, client_secret);
    res.json({
      raw: tokenResponse,
      decoded: decodeJwt(tokenResponse.access_token),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dcrRouter.post('/agent-test/:endpoint', (req, res) => {
  const { token } = req.body;
  const { endpoint } = req.params;
  if (!token) return res.status(400).json({ error: 'No token provided' });

  const decoded = decodeJwt(token);
  const scopes = decoded?.payload?.scope?.split(' ') || [];

  const scopeMap = {
    'read-reports': 'read:reports',
    'write-reports': 'write:reports',
    'admin-manage': 'admin:manage',
  };

  const required = scopeMap[endpoint];
  if (!required) return res.status(404).json({ error: 'Unknown endpoint' });

  if (!scopes.includes(required)) {
    return res.status(403).json({
      error: 'insufficient_scope',
      message: `Agent does not have "${required}" scope`,
      agent_has: scopes,
      required,
    });
  }

  const responses = {
    'read-reports': { data: [{ id: 1, title: 'Q1 Report' }, { id: 2, title: 'Q2 Report' }], agent: true },
    'write-reports': { message: 'Report created by agent', agent: true },
    'admin-manage': { message: 'Admin operation completed by agent', agent: true },
  };

  res.json({ success: true, scope_used: required, ...responses[endpoint] });
});
