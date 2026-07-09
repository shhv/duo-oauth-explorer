import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentLoginPanel from '../components/AgentLoginPanel.jsx';
import DCRPanel from '../components/DCRPanel.jsx';
import CIMDPanel from '../components/CIMDPanel.jsx';

const styles = {
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 600 },
  actions: { display: 'flex', gap: 12 },
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#334155', color: '#e2e8f0',
  },
  tabs: { display: 'flex', gap: 4, marginBottom: 24 },
  tab: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, background: '#1e293b', color: '#94a3b8',
  },
  tabActive: { background: '#334155', color: '#e2e8f0' },
  panel: { background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' },
  loginPrompt: {
    background: '#0f172a', borderRadius: 8, padding: 16,
    borderLeft: '3px solid #fbbf24', fontSize: 13, color: '#94a3b8', marginBottom: 16,
  },
};

export default function Tools() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agent');
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    fetch('/auth/status', { credentials: 'include' })
      .then((r) => r.json())
      .then(setAuthStatus)
      .catch(() => setAuthStatus({ authenticated: false }));
  }, []);

  async function quickLogin() {
    const res = await fetch('/auth/login/oauth21', { credentials: 'include' });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>OAuth 2.1 Tools</h1>
        <div style={styles.actions}>
          <button style={styles.btn} onClick={() => navigate('/')}>Home</button>
          <button style={styles.btn} onClick={() => navigate('/experiments')}>Experiments</button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'agent' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('agent')}
        >
          Agent Login
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'dcr' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('dcr')}
        >
          DCR
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'cimd' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('cimd')}
        >
          CIMD
        </button>
      </div>

      <div style={styles.panel}>
        {activeTab === 'agent' && <AgentLoginPanel />}
        {activeTab === 'dcr' && (
          <>
            {!authStatus?.authenticated || authStatus?.mode !== 'oauth21' ? (
              <div style={styles.loginPrompt}>
                <strong>OAuth 2.1 login required for DCR.</strong> Registration needs a bearer token.
                <button
                  style={{ ...styles.btn, marginLeft: 12, background: '#3b82f6' }}
                  onClick={quickLogin}
                >
                  Quick Login (OAuth 2.1)
                </button>
              </div>
            ) : null}
            <DCRPanel />
          </>
        )}
        {activeTab === 'cimd' && <CIMDPanel />}
      </div>
    </div>
  );
}
