import { useState } from 'react';

const styles = {
  section: { marginBottom: 24 },
  label: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  input: {
    padding: '10px 12px', borderRadius: 8, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: 13, width: '100%',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 450, marginBottom: 20 },
  btn: {
    padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#3b82f6', color: '#fff',
  },
  btnSecondary: {
    padding: '10px 16px', borderRadius: 8, border: '1px solid #334155', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: 'transparent', color: '#e2e8f0',
  },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 16, overflow: 'auto',
    fontSize: 12, lineHeight: 1.5, maxHeight: 300,
  },
  error: { color: '#f87171', fontSize: 13, marginTop: 8 },
  edu: {
    background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 20,
    borderLeft: '3px solid #3b82f6', fontSize: 12, color: '#94a3b8', lineHeight: 1.7,
  },
  comparison: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 },
  compCard: { background: '#0f172a', borderRadius: 8, padding: 14 },
  compTitle: { fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' },
  claim: { fontFamily: 'monospace', fontSize: 11, marginBottom: 4, color: '#cbd5e1' },
  claimMissing: { fontFamily: 'monospace', fontSize: 11, marginBottom: 4, color: '#f87171', textDecoration: 'line-through' },
  row: { display: 'flex', gap: 12, alignItems: 'center' },
  badge: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 6,
    fontSize: 11, fontWeight: 500, background: '#1a3d2e', color: '#6ee7b7',
  },
  scopeList: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  scope: {
    padding: '3px 8px', borderRadius: 6, fontSize: 11,
    background: '#1e293b', color: '#7dd3fc', border: '1px solid #334155',
  },
};

export default function AgentLoginPanel() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [agentName, setAgentName] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getAgentToken() {
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

  async function testAsAgent(endpoint) {
    if (!result?.raw?.access_token) {
      setError('Get an agent token first');
      return;
    }
    try {
      const res = await fetch(`/api/agent-test/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: result.raw.access_token }),
      });
      const data = await res.json();
      setResult((prev) => ({ ...prev, testResult: { endpoint, status: res.status, data } }));
    } catch (err) {
      setError(err.message);
    }
  }

  const decoded = result?.decoded?.payload;
  const userClaims = ['sub', 'name', 'email', 'preferred_username', 'amr'];

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Agent / Service Login</h3>

      <div style={styles.edu}>
        <strong>What is this?</strong> Client Credentials grant lets a machine (agent, cron job, service)
        authenticate as itself — no human in the loop. The token represents the <em>application</em>,
        not a person.<br /><br />
        <strong>Use cases:</strong> AI agents calling APIs, nightly batch jobs, service-to-service auth,
        CI/CD pipelines, IoT devices reporting telemetry.<br /><br />
        <strong>Key difference:</strong> No user claims (sub, name, email). The "identity" is the client_id.
        Scopes come from what the client is <em>configured</em> to access, not from group membership.
      </div>

      <div style={styles.form}>
        <div>
          <div style={styles.label}>Agent Name (for your reference)</div>
          <input
            style={styles.input}
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="e.g. report-generator, data-sync-agent"
          />
        </div>
        <div>
          <div style={styles.label}>Client ID (leave empty for default)</div>
          <input
            style={styles.input}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="From Duo Admin → Clients tab"
          />
        </div>
        <div>
          <div style={styles.label}>Client Secret (leave empty for default)</div>
          <input
            style={styles.input}
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="From Duo Admin → Clients tab"
          />
        </div>
        <button style={styles.btn} onClick={getAgentToken} disabled={loading}>
          {loading ? 'Authenticating Agent...' : 'Authenticate as Agent'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {decoded && (
        <>
          <div style={styles.section}>
            <div style={styles.row}>
              <span style={styles.badge}>Agent Authenticated</span>
              {agentName && <span style={{ fontSize: 13, color: '#e2e8f0' }}>{agentName}</span>}
            </div>
          </div>

          <div style={styles.comparison}>
            <div style={styles.compCard}>
              <div style={styles.compTitle}>Agent Token Has</div>
              {Object.entries(decoded).map(([key, val]) => (
                <div key={key} style={styles.claim}>
                  {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </div>
              ))}
            </div>
            <div style={styles.compCard}>
              <div style={styles.compTitle}>Missing (no human)</div>
              {userClaims.map((claim) => (
                <div key={claim} style={decoded[claim] ? styles.claim : styles.claimMissing}>
                  {claim}: {decoded[claim] ? String(decoded[claim]) : '(not present)'}
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8' }}>
                These claims require a human login. An agent has no identity beyond its client_id.
              </div>
            </div>
          </div>

          {decoded.scope && (
            <div style={{ marginTop: 16 }}>
              <div style={{ ...styles.label, marginBottom: 8 }}>Agent Scopes (what it can do)</div>
              <div style={styles.scopeList}>
                {decoded.scope.split(' ').map((s) => (
                  <span key={s} style={styles.scope}>{s}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ ...styles.label, marginBottom: 8 }}>Test Agent Access</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={styles.btnSecondary} onClick={() => testAsAgent('read-reports')}>
                Agent → read:reports
              </button>
              <button style={styles.btnSecondary} onClick={() => testAsAgent('write-reports')}>
                Agent → write:reports
              </button>
              <button style={styles.btnSecondary} onClick={() => testAsAgent('admin-manage')}>
                Agent → admin:manage
              </button>
            </div>
          </div>

          {result?.testResult && (
            <pre style={{ ...styles.pre, marginTop: 12 }}>
              {JSON.stringify(result.testResult, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
