const styles = {
  section: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 16, overflow: 'auto',
    fontSize: 12, lineHeight: 1.5, maxHeight: 300,
  },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: {
    padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 12, background: '#334155', color: '#94a3b8',
  },
  tabActive: { background: '#475569', color: '#e2e8f0' },
  raw: { wordBreak: 'break-all', fontSize: 11, color: '#64748b' },
};

import { useState } from 'react';

export default function TokenInspector({ tokens }) {
  const [viewing, setViewing] = useState('id_token');

  if (!tokens) return <p>No token data available.</p>;

  const decoded = tokens.decoded[viewing];
  const raw = tokens.raw[viewing];

  return (
    <div>
      <div style={styles.tabs}>
        {['id_token', 'access_token'].map((t) => (
          <button
            key={t}
            style={{ ...styles.tab, ...(viewing === t ? styles.tabActive : {}) }}
            onClick={() => setViewing(t)}
          >
            {t === 'id_token' ? 'ID Token' : 'Access Token'}
          </button>
        ))}
      </div>

      {decoded ? (
        <>
          <div style={styles.section}>
            <div style={styles.label}>Header</div>
            <pre style={styles.pre}>{JSON.stringify(decoded.header, null, 2)}</pre>
          </div>
          <div style={styles.section}>
            <div style={styles.label}>Payload</div>
            <pre style={styles.pre}>{JSON.stringify(decoded.payload, null, 2)}</pre>
          </div>
          <div style={styles.section}>
            <div style={styles.label}>Raw Token</div>
            <p style={styles.raw}>{raw}</p>
          </div>
        </>
      ) : (
        <p style={{ color: '#94a3b8' }}>Token is opaque (not a JWT) or not present.</p>
      )}
    </div>
  );
}
