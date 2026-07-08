import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { decodeJwt } from '../utils/jwt.js';

export const protectedRouter = Router();

function requireScope(scope) {
  return (req, res, next) => {
    const decoded = decodeJwt(req.session.tokens.access_token);
    const tokenScopes = decoded?.payload?.scope?.split(' ') || [];
    if (!tokenScopes.includes(scope)) {
      return res.status(403).json({
        error: 'insufficient_scope',
        required: scope,
        available: tokenScopes,
      });
    }
    next();
  };
}

protectedRouter.use(requireAuth);

protectedRouter.get('/read-reports', requireScope('read:reports'), (req, res) => {
  res.json({
    data: [
      { id: 1, title: 'Q1 Report', status: 'published' },
      { id: 2, title: 'Q2 Report', status: 'draft' },
    ],
    scope_used: 'read:reports',
  });
});

protectedRouter.post('/write-reports', requireScope('write:reports'), (req, res) => {
  res.json({
    message: 'Report created successfully',
    scope_used: 'write:reports',
  });
});

protectedRouter.post('/admin-manage', requireScope('admin:manage'), (req, res) => {
  res.json({
    message: 'Admin operation completed',
    scope_used: 'admin:manage',
  });
});

protectedRouter.get('/test-all', (req, res) => {
  const decoded = decodeJwt(req.session.tokens.access_token);
  const tokenScopes = decoded?.payload?.scope?.split(' ') || [];
  const allScopes = ['read:reports', 'write:reports', 'admin:manage'];

  const results = allScopes.map((scope) => ({
    scope,
    granted: tokenScopes.includes(scope),
  }));

  res.json({ scopes: results, raw_scope: decoded?.payload?.scope });
});
