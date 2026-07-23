import { Router } from 'express';

export const scimRouter = Router();

scimRouter.get('/scim/users', async (req, res) => {
  const { scimBaseUrl, token } = extractConfig(req);
  if (!scimBaseUrl || !token) return res.status(400).json({ error: 'Missing SCIM base URL or token' });

  try {
    const response = await fetch(`${scimBaseUrl}/Users`, {
      headers: scimHeaders(token),
    });
    res.status(response.status).json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

scimRouter.post('/scim/users', async (req, res) => {
  const { scimBaseUrl, token } = extractConfig(req);
  if (!scimBaseUrl || !token) return res.status(400).json({ error: 'Missing SCIM base URL or token' });

  try {
    const response = await fetch(`${scimBaseUrl}/Users`, {
      method: 'POST',
      headers: scimHeaders(token),
      body: JSON.stringify(req.body),
    });
    res.status(response.status).json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

scimRouter.patch('/scim/users/:id', async (req, res) => {
  const { scimBaseUrl, token } = extractConfig(req);
  if (!scimBaseUrl || !token) return res.status(400).json({ error: 'Missing SCIM base URL or token' });

  const url = `${scimBaseUrl}/Users/${req.params.id}`;
  const body = JSON.stringify(req.body);
  console.log('[SCIM PATCH]', url);
  console.log('[SCIM PATCH body]', body);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: scimHeaders(token),
      body,
    });
    const data = await response.json();
    console.log('[SCIM PATCH response]', response.status, JSON.stringify(data));
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

scimRouter.delete('/scim/users/:id', async (req, res) => {
  const { scimBaseUrl, token } = extractConfig(req);
  if (!scimBaseUrl || !token) return res.status(400).json({ error: 'Missing SCIM base URL or token' });

  try {
    const response = await fetch(`${scimBaseUrl}/Users/${req.params.id}`, {
      method: 'DELETE',
      headers: scimHeaders(token),
    });
    if (response.status === 204) return res.status(204).end();
    res.status(response.status).json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function extractConfig(req) {
  return {
    scimBaseUrl: (req.headers['x-scim-base-url'] || '').replace(/\/+$/, ''),
    token: req.headers['x-scim-token'],
  };
}

function scimHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/scim+json',
    Accept: 'application/scim+json',
  };
}
