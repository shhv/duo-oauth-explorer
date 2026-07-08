import { useState } from 'react';

const styles = {
  row: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' },
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, background: '#3b82f6', color: '#fff',
  },
  select: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: 13,
  },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 16, overflow: 'auto',
    fontSize: 12, lineHeight: 1.5, maxHeight: 400,
  },
  error: { color: '#f87171', fontSize: 13 },
};

export default function IntrospectPanel() {
  const [tokenType, setTokenType] = useState('access_token');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function introspect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/introspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token_type: tokenType }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={styles.row}>
        <select style={styles.select} value={tokenType} onChange={(e) => setTokenType(e.target.value)}>
          <option value="access_token">Access Token</option>
          <option value="id_token">ID Token</option>
        </select>
        <button style={styles.btn} onClick={introspect} disabled={loading}>
          {loading ? 'Introspecting...' : 'Introspect'}
        </button>
      </div>
      {error && <p style={styles.error}>{error}</p>}
      {data && (
        <pre style={styles.pre}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
