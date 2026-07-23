import { useState, useEffect } from 'react';

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500, marginBottom: 16 },
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  input: {
    padding: '10px 12px', borderRadius: 8, border: '1px solid #334155',
    background: '#0f172a', color: '#e2e8f0', fontSize: 13, flex: 1,
  },
  btn: {
    padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#3b82f6', color: '#fff',
    whiteSpace: 'nowrap',
  },
  btnDanger: { background: '#dc2626' },
  btnSecondary: { background: '#334155', color: '#e2e8f0' },
  pre: {
    background: '#0f172a', borderRadius: 8, padding: 16, overflow: 'auto',
    fontSize: 12, lineHeight: 1.5, maxHeight: 300,
  },
  error: { color: '#f87171', fontSize: 13 },
  note: { color: '#94a3b8', fontSize: 12, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 },
  th: {
    textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #334155',
    color: '#94a3b8', fontSize: 12, fontWeight: 500,
  },
  td: { padding: '8px 12px', borderBottom: '1px solid #1e293b', color: '#e2e8f0' },
  badge: (active) => ({
    padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
    background: active ? '#065f4620' : '#7f1d1d40',
    color: active ? '#4ade80' : '#f87171',
  }),
  section: { marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' },
};

const LS_KEY = 'scim_config';

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

export default function SCIMPanel() {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [users, setUsers] = useState([]);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ userName: '', displayName: '', userType: '' });
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUserType, setEditUserType] = useState('');

  useEffect(() => {
    const saved = loadConfig();
    if (saved.baseUrl) setBaseUrl(saved.baseUrl);
    if (saved.token) setToken(saved.token);
  }, []);

  function saveConfig(url, tok) {
    localStorage.setItem(LS_KEY, JSON.stringify({ baseUrl: url, token: tok }));
  }

  function headers() {
    return { 'Content-Type': 'application/json', 'X-SCIM-Base-URL': baseUrl, 'X-SCIM-Token': token };
  }

  async function scimFetch(path, opts = {}) {
    setLoading(true);
    setError(null);
    const method = opts.method || 'GET';
    try {
      const res = await fetch(`/api/scim${path}`, { headers: headers(), ...opts });
      if (res.status === 204) {
        setResponse({ _status: 204, _method: method, _path: path, message: 'Deleted successfully' });
        return null;
      }
      const data = await res.json();
      setResponse({ _status: res.status, _method: method, _path: path, ...data });
      if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function listUsers() {
    saveConfig(baseUrl, token);
    const data = await scimFetch('/users');
    if (data?.Resources) setUsers(data.Resources);
  }

  async function createUser() {
    const payload = {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      userName: newUser.userName,
      displayName: newUser.displayName,
    };
    if (newUser.userType) payload.userType = newUser.userType;
    const data = await scimFetch('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data?.id) {
      setNewUser({ userName: '', displayName: '', userType: '' });
      listUsers();
    }
  }

  async function updateUser(id) {
    const ops = [{ op: 'replace', path: 'displayName', value: editName }];
    if (editUserType) ops.push({ op: 'replace', path: 'userType', value: editUserType });
    const payload = {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      Operations: ops,
    };
    console.log('SCIM PATCH payload:', JSON.stringify(payload, null, 2));
    const data = await scimFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (data && !data.detail) {
      setEditingId(null);
      listUsers();
    }
  }

  async function toggleActive(user) {
    await scimFetch(`/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [{ op: 'replace', path: 'active', value: !user.active }],
      }),
    });
    listUsers();
  }

  async function deleteUser(id) {
    await scimFetch(`/users/${id}`, { method: 'DELETE' });
    listUsers();
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>SCIM Provisioning</h3>
      <p style={styles.note}>
        Test Duo's Generic SCIM Inbound endpoint — list, create, update, and delete users.
        Enter your SCIM Base URL and Bearer Token from the Duo Admin Panel.
      </p>

      <div style={styles.form}>
        <input
          style={styles.input}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="SCIM Base URL (e.g. https://api-xxxxxxxx.duosecurity.com/accounts/.../scim/v2)"
        />
        <input
          style={styles.input}
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer Token"
        />
        <button style={styles.btn} onClick={listUsers} disabled={loading || !baseUrl || !token}>
          {loading ? 'Loading...' : 'List Users'}
        </button>
      </div>

      {users.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>userName</th>
              <th style={styles.th}>displayName</th>
              <th style={styles.th}>Active</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={styles.td}>{u.userName}</td>
                <td style={styles.td}>
                  {editingId === u.id ? (
                    <div style={{ ...styles.row, flexWrap: 'wrap' }}>
                      <input
                        style={{ ...styles.input, flex: 1 }}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="displayName"
                      />
                      <input
                        style={{ ...styles.input, flex: 1 }}
                        value={editUserType}
                        onChange={(e) => setEditUserType(e.target.value)}
                        placeholder="userType (alias)"
                      />
                      <button style={{ ...styles.btn, padding: '6px 10px' }} onClick={() => updateUser(u.id)}>
                        Save
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.btnSecondary, padding: '6px 10px' }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    u.displayName
                  )}
                </td>
                <td style={styles.td}>
                  <span style={styles.badge(u.active)}>{u.active ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.row}>
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary, padding: '6px 10px' }}
                      onClick={() => { setEditingId(u.id); setEditName(u.displayName || ''); setEditUserType(u.userType || ''); }}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary, padding: '6px 10px' }}
                      onClick={() => toggleActive(u)}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnDanger, padding: '6px 10px' }}
                      onClick={() => deleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={styles.section}>
        <h4 style={{ fontSize: 14, marginBottom: 8, color: '#e2e8f0' }}>Create User</h4>
        <div style={{ ...styles.form, flexDirection: 'row', maxWidth: 600 }}>
          <input
            style={styles.input}
            value={newUser.userName}
            onChange={(e) => setNewUser({ ...newUser, userName: e.target.value })}
            placeholder="userName (email)"
          />
          <input
            style={styles.input}
            value={newUser.displayName}
            onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
            placeholder="displayName"
          />
          <input
            style={styles.input}
            value={newUser.userType}
            onChange={(e) => setNewUser({ ...newUser, userType: e.target.value })}
            placeholder="userType (optional — e.g. admin alias UPN)"
          />
          <button
            style={styles.btn}
            onClick={createUser}
            disabled={loading || !newUser.userName}
          >
            Create
          </button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {response && (
        <div style={styles.section}>
          <h4 style={{ fontSize: 14, marginBottom: 8, color: '#e2e8f0' }}>Response</h4>
          <pre style={styles.pre}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
