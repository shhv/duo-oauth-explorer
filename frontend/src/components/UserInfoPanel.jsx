import { useState } from 'react';

const styles = {
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, background: '#3b82f6', color: '#fff', marginBottom: 16,
  },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 16, overflow: 'auto',
    fontSize: 12, lineHeight: 1.5, maxHeight: 400,
  },
  error: { color: '#f87171', fontSize: 13 },
};

export default function UserInfoPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/userinfo', { credentials: 'include' });
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
      <button style={styles.btn} onClick={fetchData} disabled={loading}>
        {loading ? 'Fetching...' : 'Fetch UserInfo'}
      </button>
      {error && <p style={styles.error}>{error}</p>}
      {data && <pre style={styles.pre}>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
