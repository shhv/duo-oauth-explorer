import { useState } from 'react';

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400, marginBottom: 16 },
  input: {
    padding: '10px 12px', borderRadius: 8, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: 13,
  },
  btn: {
    padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#3b82f6', color: '#fff',
  },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 16, overflow: 'auto',
    fontSize: 12, lineHeight: 1.5, maxHeight: 400,
  },
  error: { color: '#f87171', fontSize: 13 },
  note: { color: '#94a3b8', fontSize: 12, marginBottom: 16 },
  label: { fontSize: 12, color: '#94a3b8' },
};

export default function ClientCredPanel() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getToken() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/client-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          client_id: clientId || undefined,
          client_secret: clientSecret || undefined,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Client Credentials Grant</h3>
      <p style={styles.note}>
        Get a machine token (no user context). Notice: no sub, name, or email claims.
        Leave fields empty to use the default OAuth 2.1 client from .env.
      </p>

      <div style={styles.form}>
        <div>
          <div style={styles.label}>Client ID (optional — uses default)</div>
          <input
            style={styles.input}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Client ID"
          />
        </div>
        <div>
          <div style={styles.label}>Client Secret (optional — uses default)</div>
          <input
            style={styles.input}
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Client Secret"
          />
        </div>
        <button style={styles.btn} onClick={getToken} disabled={loading}>
          {loading ? 'Requesting...' : 'Get Machine Token'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {result && (
        <>
          <pre style={styles.pre}>{JSON.stringify(result.decoded, null, 2)}</pre>
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}>
              Raw token response
            </summary>
            <pre style={{ ...styles.pre, marginTop: 8 }}>
              {JSON.stringify(result.raw, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
