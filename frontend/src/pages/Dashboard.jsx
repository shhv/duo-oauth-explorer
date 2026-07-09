import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TokenInspector from '../components/TokenInspector.jsx';
import ClaimsTable from '../components/ClaimsTable.jsx';
import RefreshDemo from '../components/RefreshDemo.jsx';
import UserInfoPanel from '../components/UserInfoPanel.jsx';
import IntrospectPanel from '../components/IntrospectPanel.jsx';
import ScopePanel from '../components/ScopePanel.jsx';
import DCRPanel from '../components/DCRPanel.jsx';
import ClientCredPanel from '../components/ClientCredPanel.jsx';
import AgentLoginPanel from '../components/AgentLoginPanel.jsx';

const styles = {
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 600 },
  modeBadge: { padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500 },
  actions: { display: 'flex', gap: 12, alignItems: 'center' },
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#334155', color: '#e2e8f0',
  },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' },
  tab: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, background: '#1e293b', color: '#94a3b8',
  },
  tabActive: { background: '#334155', color: '#e2e8f0' },
  panel: { background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' },
};

const TABS = [
  { id: 'tokens', label: 'Token Inspector' },
  { id: 'claims', label: 'Claims' },
  { id: 'refresh', label: 'Refresh' },
  { id: 'userinfo', label: 'UserInfo' },
  { id: 'introspect', label: 'Introspect' },
  { id: 'scopes', label: 'Scopes', oauth21Only: true },
  { id: 'agent', label: 'Agent Login', oauth21Only: true },
  { id: 'dcr', label: 'DCR', oauth21Only: true },
  { id: 'clientcred', label: 'Client Creds', oauth21Only: true },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(null);
  const [mode, setMode] = useState(null);
  const [activeTab, setActiveTab] = useState('tokens');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tokens', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Not authenticated');
        return r.json();
      })
      .then((data) => {
        setTokens(data);
        setMode(data.mode);
        setLoading(false);
      })
      .catch(() => navigate('/'));
  }, [navigate]);

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    navigate('/');
  }

  if (loading) return <div style={styles.container}>Loading...</div>;

  const visibleTabs = TABS.filter((t) => !t.oauth21Only || mode === 'oauth21');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <div style={styles.actions}>
          <span style={{
            ...styles.modeBadge,
            background: mode === 'oauth21' ? '#1a3d2e' : '#1e3a5f',
            color: mode === 'oauth21' ? '#6ee7b7' : '#7dd3fc',
          }}>
            {mode === 'oauth21' ? 'OAuth 2.1' : 'Generic OIDC'}
          </span>
          <button style={styles.btn} onClick={() => navigate('/')}>Home</button>
          <button style={styles.btn} onClick={() => navigate('/compare')}>Compare</button>
          <button style={styles.btn} onClick={() => navigate('/experiments')}>Experiments</button>
          <button style={styles.btn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.tabs}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.panel}>
        {activeTab === 'tokens' && <TokenInspector tokens={tokens} />}
        {activeTab === 'claims' && <ClaimsTable tokens={tokens} />}
        {activeTab === 'refresh' && <RefreshDemo tokens={tokens} onRefresh={setTokens} />}
        {activeTab === 'userinfo' && <UserInfoPanel />}
        {activeTab === 'introspect' && <IntrospectPanel />}
        {activeTab === 'scopes' && <ScopePanel />}
        {activeTab === 'agent' && <AgentLoginPanel />}
        {activeTab === 'dcr' && <DCRPanel />}
        {activeTab === 'clientcred' && <ClientCredPanel />}
      </div>
    </div>
  );
}
