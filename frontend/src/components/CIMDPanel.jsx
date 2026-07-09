import { useState } from 'react';

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 550, marginBottom: 16 },
  label: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  input: {
    padding: '10px 12px', borderRadius: 8, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: 13, width: '100%',
  },
  btn: {
    padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#3b82f6', color: '#fff',
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
  note: { color: '#94a3b8', fontSize: 12, marginBottom: 16 },
  success: { color: '#6ee7b7', fontSize: 13, marginTop: 8 },
};

const DEFAULT_CIMD_URL = 'https://gist.githubusercontent.com/shhv/74a119e14f33a31cd69d99cf39be3bef/raw/cimd-metadata.json';

export default function CIMDPanel() {
  const [metadataUrl, setMetadataUrl] = useState(DEFAULT_CIMD_URL);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchMetadata() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(metadataUrl);
      if (!res.ok) throw new Error(`Failed to fetch metadata (${res.status})`);
      const data = await res.json();
      setMetadata(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithCIMD() {
    setError(null);
    try {
      const res = await fetch(`/auth/login/oauth21?dcr_client_id=${encodeURIComponent(metadataUrl)}`, {
        credentials: 'include',
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Client ID Metadata Documents (CIMD)</h3>

      <div style={styles.edu}>
        <strong>How CIMD works:</strong> Instead of registering at Duo's endpoint (DCR), the client
        hosts a JSON metadata document at a public URL. The URL itself <em>becomes</em> the client_id.<br /><br />
        <strong>Flow:</strong><br />
        1. Client hosts metadata JSON at a public URL (e.g. GitHub gist)<br />
        2. Client uses that URL as its <code>client_id</code> in the authorize request<br />
        3. Duo fetches the metadata to learn the client's name and redirect URIs<br />
        4. Client appears under "CIMD Clients" in Duo Admin (cannot be deleted)<br /><br />
        <strong>vs DCR:</strong> DCR sends metadata TO Duo. CIMD tells Duo WHERE to find it.
        CIMD clients are permanent — they can't be deleted from the admin panel.
      </div>

      <div style={styles.form}>
        <div>
          <div style={styles.label}>Metadata Document URL (this IS the client_id)</div>
          <input
            style={styles.input}
            value={metadataUrl}
            onChange={(e) => setMetadataUrl(e.target.value)}
            placeholder="https://example.com/client-metadata.json"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.btn} onClick={fetchMetadata} disabled={loading}>
            {loading ? 'Fetching...' : 'Preview Metadata'}
          </button>
          <button style={styles.btn} onClick={loginWithCIMD}>
            Login with CIMD Client
          </button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {metadata && (
        <>
          <p style={styles.success}>Metadata document found:</p>
          <pre style={styles.pre}>{JSON.stringify(metadata, null, 2)}</pre>
          <p style={{ ...styles.note, marginTop: 12 }}>
            When you click "Login with CIMD Client", Duo will use <code>{metadata.client_id}</code> as
            the client_id and fetch this document to verify the redirect_uri.
          </p>
        </>
      )}
    </div>
  );
}
