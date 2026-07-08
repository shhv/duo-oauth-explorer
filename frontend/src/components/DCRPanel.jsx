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
    fontSize: 12, lineHeight: 1.5, maxHeight: 300,
  },
  error: { color: '#f87171', fontSize: 13 },
  note: { color: '#94a3b8', fontSize: 12, marginBottom: 16 },
};

export default function DCRPanel() {
  const [clientName, setClientName] = useState('DuoExplorer-Dynamic');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function registerClient() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dcr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ client_name: clientName }),
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
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Dynamic Client Registration</h3>
      <p style={styles.note}>
        Register a new OAuth client dynamically (RFC 7591). Only available with OAuth 2.1 integration.
      </p>

      <div style={styles.form}>
        <input
          style={styles.input}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client name"
        />
        <button style={styles.btn} onClick={registerClient} disabled={loading}>
          {loading ? 'Registering...' : 'Register Client'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {result && (
        <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
