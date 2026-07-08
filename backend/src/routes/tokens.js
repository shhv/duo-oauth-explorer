import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { decodeJwt } from '../utils/jwt.js';
import { introspectToken, fetchUserInfo } from '../utils/oauth.js';

export const tokensRouter = Router();

tokensRouter.get('/tokens', requireAuth, (req, res) => {
  const { access_token, id_token, refresh_token, expires_in, scope } = req.session.tokens;

  res.json({
    mode: req.session.mode,
    raw: { access_token, id_token, refresh_token, expires_in, scope },
    decoded: {
      access_token: decodeJwt(access_token),
      id_token: decodeJwt(id_token),
    },
  });
});

tokensRouter.get('/userinfo', requireAuth, async (req, res) => {
  try {
    const data = await fetchUserInfo(req.session.mode, req.session.tokens.access_token);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

tokensRouter.post('/introspect', requireAuth, async (req, res) => {
  const { token_type } = req.body;
  const token = token_type === 'id_token'
    ? req.session.tokens.id_token
    : req.session.tokens.access_token;

  try {
    const data = await introspectToken(req.session.mode, token);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
