import { useNavigate } from 'react-router-dom';

const styles = {
  container: { maxWidth: 1000, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700 },
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#334155', color: '#e2e8f0',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155' },
  td: { padding: '12px 16px', borderBottom: '1px solid #1e293b' },
  yes: { color: '#6ee7b7' },
  no: { color: '#f87171' },
  partial: { color: '#fbbf24' },
};

const FEATURES = [
  { feature: 'Authorization Code + PKCE', oidc: 'yes', oauth21: 'yes', note: 'Both support it; 2.1 makes PKCE configurable' },
  { feature: 'Refresh Tokens', oidc: 'yes', oauth21: 'yes', note: 'Both issue refresh tokens' },
  { feature: 'ID Token (OIDC)', oidc: 'yes', oauth21: 'yes', note: 'Standard OIDC claims in both' },
  { feature: 'UserInfo Endpoint', oidc: 'yes', oauth21: 'yes', note: 'Both proxy to Duo UserInfo' },
  { feature: 'Token Introspection', oidc: 'yes', oauth21: 'yes', note: 'Both support RFC 7662' },
  { feature: 'Custom Claim Transforms', oidc: 'yes', oauth21: 'yes', note: 'Both support claim transforms in Duo Admin' },
  { feature: 'Resource Indicator (aud)', oidc: 'partial', oauth21: 'yes', note: 'OIDC: app-level aud only; 2.1: specific resource URL' },
  { feature: 'Group → Scope Policy', oidc: 'no', oauth21: 'yes', note: '2.1 maps Duo groups to granular scopes' },
  { feature: 'Dynamic Client Registration', oidc: 'no', oauth21: 'yes', note: 'RFC 7591 — register clients on the fly' },
  { feature: 'Client Credentials Grant', oidc: 'no', oauth21: 'yes', note: 'Machine-to-machine tokens, no user context' },
  { feature: 'Custom Scopes', oidc: 'no', oauth21: 'yes', note: '2.1 lets you define app-specific scopes' },
];

function Status({ value }) {
  if (value === 'yes') return <span style={styles.yes}>Yes</span>;
  if (value === 'no') return <span style={styles.no}>No</span>;
  return <span style={styles.partial}>Partial</span>;
}

export default function Compare() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Feature Comparison</h1>
        <button style={styles.btn} onClick={() => navigate('/')}>← Home</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Feature</th>
            <th style={styles.th}>Generic OIDC</th>
            <th style={styles.th}>OAuth 2.1</th>
            <th style={styles.th}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((row) => (
            <tr key={row.feature}>
              <td style={styles.td}>{row.feature}</td>
              <td style={styles.td}><Status value={row.oidc} /></td>
              <td style={styles.td}><Status value={row.oauth21} /></td>
              <td style={{ ...styles.td, color: '#94a3b8', fontSize: 13 }}>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
