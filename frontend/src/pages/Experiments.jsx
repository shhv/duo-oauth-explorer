import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700 },
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, background: '#334155', color: '#e2e8f0',
  },
  experiment: {
    background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 16,
    border: '1px solid #334155',
  },
  expTitle: { fontSize: 16, fontWeight: 600, marginBottom: 8 },
  expDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 },
  steps: { paddingLeft: 20, fontSize: 13, color: '#cbd5e1', lineHeight: 2 },
  tag: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 6,
    fontSize: 11, fontWeight: 500, marginRight: 8, marginBottom: 8,
  },
  tagOidc: { background: '#1e3a5f', color: '#7dd3fc' },
  tagOauth21: { background: '#1a3d2e', color: '#6ee7b7' },
  tagBoth: { background: '#3b3220', color: '#fbbf24' },
  insight: {
    background: '#0f172a', borderRadius: 8, padding: 12, marginTop: 12,
    borderLeft: '3px solid #3b82f6', fontSize: 13, color: '#94a3b8',
  },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' },
};

const EXPERIMENTS = [
  {
    title: 'Compare the aud claim',
    tags: ['both'],
    description: 'See how the access token audience differs between integration types.',
    steps: [
      'Login with Generic OIDC → Token Inspector → Access Token → look at "aud"',
      'Logout → Login with OAuth 2.1 → same view → compare "aud"',
      'OIDC: aud = client ID (who requested the token)',
      'OAuth 2.1: aud = resource URL (which API the token is for)',
    ],
    insight: 'Resource indicators prevent token replay attacks across services. A token for your Reports API cannot be used against your Billing API.',
  },
  {
    title: 'Observe scope differences by group',
    tags: ['oauth21'],
    description: 'Different users get different scopes based on Duo group membership.',
    steps: [
      'In Duo Admin: assign user to "Viewers" group only',
      'Login with OAuth 2.1 → Claims tab → look at "scope" claim',
      'Go to Scopes tab → try all three test buttons',
      'read:reports → 200 OK, write:reports → 403, admin:manage → 403',
      'Now add the user to "Editors" group → logout/login → retest',
    ],
    insight: 'The token carries authorization decisions made at the IdP. Your API just checks the scope claim — no need to call back to Duo for every request.',
  },
  {
    title: 'Get a machine token (no user)',
    tags: ['oauth21'],
    description: 'Client credentials grant produces a token with no human identity.',
    steps: [
      'Login with OAuth 2.1 → Client Creds tab → "Get Machine Token"',
      'Look at the decoded token — no sub, name, or email claims',
      'Compare side-by-side with your user token in Token Inspector',
      'The machine token has: iss, aud, exp, iat, scope, client_id',
      'Missing: sub, name, email, preferred_username, amr',
    ],
    insight: 'Machine tokens represent a service, not a person. Use for cron jobs, backend-to-backend calls, CI/CD. You cannot attribute actions to a specific user with these.',
  },
  {
    title: 'Register a client dynamically',
    tags: ['oauth21'],
    description: 'Create a new OAuth client without touching the Duo Admin console.',
    steps: [
      'Login with OAuth 2.1 → DCR tab',
      'Enter a client name → "Register Client"',
      'Note the client_id and client_secret in the response',
      'Copy them into the Client Creds tab → "Get Machine Token"',
      'You just provisioned and used a new client entirely via API',
    ],
    insight: 'DCR enables self-service: developer portals, multi-tenant SaaS onboarding, ephemeral CI environments. No admin bottleneck.',
  },
  {
    title: 'Refresh token rotation',
    tags: ['both'],
    description: 'Watch how tokens change on refresh and understand rotation.',
    steps: [
      'Login → Refresh tab → note the countdown timer',
      'Click "Refresh Now" before expiry',
      'Compare old vs new payload in the diff view',
      'iat and exp changed — new token lifetime started',
      'jti changed — this is a completely new token, not an extension',
    ],
    insight: 'Refresh rotation means the old refresh token is invalidated. If an attacker stole it, it only works once. The legitimate client gets a new one each time.',
  },
  {
    title: 'Token introspection vs JWT decode',
    tags: ['both'],
    description: 'Understand when to decode locally vs ask the IdP.',
    steps: [
      'Token Inspector shows what the JWT contains (local decode)',
      'Introspect tab asks Duo "is this token still valid?"',
      'Both show the same claims, but introspect also returns "active: true/false"',
      'Try this: revoke the user session in Duo Admin',
      'JWT decode still shows the token (it has not changed)',
      'Introspect now returns active: false (Duo knows it is revoked)',
    ],
    insight: 'Local JWT validation is fast but cannot detect revocation until expiry. Introspection is authoritative but adds latency. Use introspection for sensitive operations (transfers, admin actions).',
  },
  {
    title: 'Understand the amr claim',
    tags: ['both'],
    description: 'See which authentication methods were used.',
    steps: [
      'Login with any mode → Claims tab → find "amr"',
      'It shows an array like ["pwd", "mfa", "duo"]',
      'pwd = password was verified',
      'mfa = multi-factor was completed',
      'duo = Duo specifically was the MFA provider',
    ],
    insight: 'APIs can require specific amr values for sensitive operations. For example: require "hwk" (hardware key) for admin actions, even if the user normally uses push.',
  },
  {
    title: 'ID Token vs Access Token — who sees what',
    tags: ['both'],
    description: 'These two tokens serve different audiences.',
    steps: [
      'Token Inspector → toggle between ID Token and Access Token',
      'ID Token: meant for YOUR app. Contains user profile claims.',
      'Access Token: meant for the RESOURCE SERVER (API). Contains authorization.',
      'ID Token aud = your client_id (token is for your app)',
      'Access Token aud = resource URL in 2.1 (token is for the API)',
      'Never send the ID token to an API. Never use the access token for user display.',
    ],
    insight: 'ID Token answers "who is this?" for your frontend. Access Token answers "what can they do?" for your API. Mixing them up is a common security mistake.',
  },
];

export default function Experiments() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);

  function tagStyle(tag) {
    if (tag === 'oauth21') return styles.tagOauth21;
    if (tag === 'oidc') return styles.tagOidc;
    return styles.tagBoth;
  }

  function tagLabel(tag) {
    if (tag === 'oauth21') return 'OAuth 2.1 Only';
    if (tag === 'oidc') return 'Generic OIDC';
    return 'Both Modes';
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Guided Experiments</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.btn} onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button style={styles.btn} onClick={() => navigate('/')}>Home</button>
        </div>
      </div>

      <p style={{ color: '#94a3b8', marginBottom: 32, lineHeight: 1.6 }}>
        Work through these experiments to understand how OAuth 2.1 extends standard OIDC.
        Each one highlights a specific capability with step-by-step instructions.
      </p>

      {EXPERIMENTS.map((exp, i) => (
        <div key={i} style={styles.experiment}>
          <div style={{ marginBottom: 8 }}>
            {exp.tags.map((tag) => (
              <span key={tag} style={{ ...styles.tag, ...tagStyle(tag) }}>
                {tagLabel(tag)}
              </span>
            ))}
          </div>
          <h3
            style={{ ...styles.expTitle, cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            {expanded === i ? '▾' : '▸'} {exp.title}
          </h3>
          <p style={styles.expDesc}>{exp.description}</p>

          {expanded === i && (
            <>
              <ol style={styles.steps}>
                {exp.steps.map((step, j) => <li key={j}>{step}</li>)}
              </ol>
              <div style={styles.insight}>
                <strong>Key insight:</strong> {exp.insight}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
