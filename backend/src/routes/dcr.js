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
        grant_types: grant_types || ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_basic',
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
