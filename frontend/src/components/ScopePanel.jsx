import { useState, useEffect } from 'react';

const styles = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 },
  card: { background: '#0f172a', borderRadius: 8, padding: 16 },
  scopeName: { fontFamily: 'monospace', fontSize: 13, marginBottom: 4 },
  granted: { color: '#6ee7b7', fontSize: 12 },
  denied: { color: '#f87171', fontSize: 12 },
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, background: '#3b82f6', color: '#fff', marginRight: 8, marginBottom: 8,
  },
  result: {
    background: '#0f172a', borderRadius: 8, padding: 12, marginTop: 12,
    fontSize: 12, overflow: 'auto', maxHeight: 200,
  },
  error: { color: '#f87171', fontSize: 13 },
};

export default function ScopePanel() {
  const [scopes, setScopes] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetch('/api/protected/test-all', { credentials: 'include' })
      .then((r) => r.json())
      .then(setScopes)
      .catch(() => {});
  }, []);

  async function testEndpoint(path) {
    const method = path === 'read-reports' ? 'GET' : 'POST';
    try {
      const res = await fetch(`/api/protected/${path}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResult({ path, status: res.status, data });
    } catch (err) {
      setTestResult({ path, error: err.message });
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Scope-Based Access Control</h3>

      {scopes && (
        <div style={styles.grid}>
          {scopes.scopes.map((s) => (
            <div key={s.scope} style={styles.card}>
              <div style={styles.scopeName}>{s.scope}</div>
              <div style={s.granted ? styles.granted : styles.denied}>
                {s.granted ? 'Granted' : 'Not granted'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <button style={styles.btn} onClick={() => testEndpoint('read-reports')}>
          Test read:reports
        </button>
        <button style={styles.btn} onClick={() => testEndpoint('write-reports')}>
          Test write:reports
        </button>
        <button style={styles.btn} onClick={() => testEndpoint('admin-manage')}>
          Test admin:manage
        </button>
      </div>

      {testResult && (
        <pre style={styles.result}>
          {JSON.stringify(testResult, null, 2)}
        </pre>
      )}
    </div>
  );
}
