import { Router } from 'express';
import { config, getIntegrationConfig } from '../config.js';
import { generatePKCE } from '../utils/pkce.js';
import { exchangeCode, refreshTokens } from '../utils/oauth.js';
import { decodeJwt } from '../utils/jwt.js';

export const authRouter = Router();

authRouter.get('/login/:mode', (req, res) => {
  const { mode } = req.params;
  const cfg = getIntegrationConfig(mode);
  const { verifier, challenge } = generatePKCE();

  req.session.pkceVerifier = verifier;
  req.session.authMode = mode;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: 'openid profile email offline_access',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: mode,
  });

  if (mode === 'oauth21' && cfg.resource) {
    params.set('resource', cfg.resource);
  }

  res.json({ url: `${cfg.authorizeUrl}?${params}` });
});

authRouter.get('/callback/:mode', async (req, res) => {
  const { mode } = req.params;
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(
      `${config.frontendUrl}?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (!code || !req.session.pkceVerifier) {
    return res.redirect(`${config.frontendUrl}?error=missing_code_or_verifier`);
  }

  try {
    const tokenResponse = await exchangeCode(mode, code, req.session.pkceVerifier);
    req.session.tokens = tokenResponse;
    req.session.mode = mode;
    delete req.session.pkceVerifier;

    res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (err) {
    console.error('Token exchange error:', err.message);
    res.redirect(
      `${config.frontendUrl}?error=${encodeURIComponent(err.message)}`
    );
  }
});

authRouter.post('/refresh', async (req, res) => {
  if (!req.session?.tokens?.refresh_token || !req.session.mode) {
    return res.status(400).json({ error: 'No refresh token available' });
  }

  try {
    const oldTokens = req.session.tokens;
    const newTokens = await refreshTokens(req.session.mode, oldTokens.refresh_token);
    req.session.tokens = { ...oldTokens, ...newTokens };

    const oldDecoded = decodeJwt(oldTokens.access_token);
    const newDecoded = decodeJwt(newTokens.access_token);

    res.json({
      tokens: newTokens,
      diff: {
        old: oldDecoded?.payload,
        new: newDecoded?.payload,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

authRouter.get('/status', (req, res) => {
  if (!req.session?.tokens) {
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    mode: req.session.mode,
  });
});
