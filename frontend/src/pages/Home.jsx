import { useSearchParams, useNavigate } from 'react-router-dom';

const styles = {
  container: { maxWidth: 800, margin: '0 auto', padding: '60px 24px', textAlign: 'center' },
  title: { fontSize: 36, fontWeight: 700, marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#94a3b8', marginBottom: 48 },
  cards: { display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' },
  card: {
    background: '#1e293b', borderRadius: 12, padding: 32, width: 340,
    border: '1px solid #334155', cursor: 'pointer', transition: 'border-color 0.2s',
  },
  cardTitle: { fontSize: 20, fontWeight: 600, marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  badge: {
    display: 'inline-block', padding: '4px 10px', borderRadius: 12,
    fontSize: 12, fontWeight: 500,
  },
  error: { background: '#3b1111', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 24 },
  nav: { marginTop: 32 },
  link: { color: '#60a5fa', textDecoration: 'none', fontSize: 14 },
};

export default function Home() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const error = params.get('error');

  async function login(mode) {
    const res = await fetch(`/auth/login/${mode}`, { credentials: 'include' });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Duo OAuth Explorer</h1>
      <p style={styles.subtitle}>
        Compare Generic OIDC Relying Party vs OAuth 2.1 / OIDC SSO — side by side
      </p>

      {error && <div style={styles.error}>Error: {error}</div>}

      <div style={styles.cards}>
        <div style={styles.card} onClick={() => login('oidc')}>
          <h2 style={styles.cardTitle}>Generic OIDC</h2>
          <p style={styles.cardDesc}>
            Standard OIDC Relying Party integration. Auth Code + PKCE, refresh tokens, basic scopes.
          </p>
          <span style={{ ...styles.badge, background: '#1e3a5f', color: '#7dd3fc' }}>
            Standard OIDC
          </span>
        </div>

        <div style={styles.card} onClick={() => login('oauth21')}>
          <h2 style={styles.cardTitle}>OAuth 2.1 / OIDC SSO</h2>
          <p style={styles.cardDesc}>
            Full OAuth 2.1 with resource indicators, DCR, client credentials, group → scope policy.
          </p>
          <span style={{ ...styles.badge, background: '#1a3d2e', color: '#6ee7b7' }}>
            OAuth 2.1 + Extensions
          </span>
        </div>
      </div>

      <nav style={styles.nav}>
        <a href="/compare" style={styles.link} onClick={(e) => { e.preventDefault(); navigate('/compare'); }}>
          View feature comparison →
        </a>
        <span style={{ margin: '0 12px', color: '#475569' }}>|</span>
        <a href="/experiments" style={styles.link} onClick={(e) => { e.preventDefault(); navigate('/experiments'); }}>
          Guided experiments →
        </a>
        <span style={{ margin: '0 12px', color: '#475569' }}>|</span>
        <a href="/tools" style={styles.link} onClick={(e) => { e.preventDefault(); navigate('/tools'); }}>
          Tools (DCR, CIMD, SCIM) →
        </a>
      </nav>
    </div>
  );
}
