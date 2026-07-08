const styles = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 12px', background: '#0f172a', color: '#94a3b8', fontWeight: 500 },
  td: { padding: '8px 12px', borderBottom: '1px solid #0f172a' },
  key: { fontFamily: 'monospace', color: '#7dd3fc' },
  val: { fontFamily: 'monospace', wordBreak: 'break-all' },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: {
    padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 12, background: '#334155', color: '#94a3b8',
  },
  tabActive: { background: '#475569', color: '#e2e8f0' },
};

import { useState } from 'react';

export default function ClaimsTable({ tokens }) {
  const [viewing, setViewing] = useState('id_token');

  if (!tokens?.decoded) return <p>No claims available.</p>;

  const decoded = tokens.decoded[viewing];
  const claims = decoded?.payload || {};

  return (
    <div>
      <div style={styles.tabs}>
        {['id_token', 'access_token'].map((t) => (
          <button
            key={t}
            style={{ ...styles.tab, ...(viewing === t ? styles.tabActive : {}) }}
            onClick={() => setViewing(t)}
          >
            {t === 'id_token' ? 'ID Token Claims' : 'Access Token Claims'}
          </button>
        ))}
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Claim</th>
            <th style={styles.th}>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(claims).map(([key, value]) => (
            <tr key={key}>
              <td style={{ ...styles.td, ...styles.key }}>{key}</td>
              <td style={{ ...styles.td, ...styles.val }}>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
