import { useState, useEffect } from 'react';

const styles = {
  row: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 },
  countdown: { fontSize: 24, fontWeight: 700, fontFamily: 'monospace' },
  btn: {
    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 500, background: '#3b82f6', color: '#fff',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  diff: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 12, overflow: 'auto',
    fontSize: 11, lineHeight: 1.5, maxHeight: 200,
  },
};

export default function RefreshDemo({ tokens, onRefresh }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    const exp = tokens?.decoded?.access_token?.payload?.exp;
    if (!exp) return;

    const update = () => {
      const remaining = exp - Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(0, remaining));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [tokens]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      setDiff(data.diff);
      const updated = await fetch('/api/tokens', { credentials: 'include' });
      const newTokens = await updated.json();
      onRefresh(newTokens);
    } catch (err) {
      alert(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  const hasRefreshToken = !!tokens?.raw?.refresh_token;

  return (
    <div>
      <div style={styles.row}>
        <div>
          <div style={styles.label}>Access Token Expires In</div>
          <div style={styles.countdown}>
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
        <button
          style={{ ...styles.btn, ...(!hasRefreshToken || refreshing ? styles.btnDisabled : {}) }}
          onClick={handleRefresh}
          disabled={!hasRefreshToken || refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {!hasRefreshToken && (
        <p style={{ color: '#f87171', fontSize: 13 }}>No refresh token available.</p>
      )}

      {diff && (
        <>
          <div style={styles.label}>Token Diff (old → new)</div>
          <div style={styles.diff}>
            <div>
              <div style={{ ...styles.label, fontSize: 11 }}>Old Payload</div>
              <pre style={styles.pre}>{JSON.stringify(diff.old, null, 2)}</pre>
            </div>
            <div>
              <div style={{ ...styles.label, fontSize: 11 }}>New Payload</div>
              <pre style={styles.pre}>{JSON.stringify(diff.new, null, 2)}</pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
