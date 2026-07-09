# Duo OAuth Explorer

Compare Duo's two OAuth integrations side by side: **Generic OIDC Relying Party** vs **OAuth 2.1 / OIDC SSO**.

## Quick Start

```bash
./scripts/setup.sh     # copies .env.example, installs deps
# Fill in .env with your Duo integration values
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
# Open http://localhost:5174
```

## Pages

| Path | Purpose |
|------|---------|
| `/` | Home — pick integration mode (OIDC or OAuth 2.1) |
| `/dashboard` | Post-login — tabbed token/claims/scope explorer |
| `/compare` | Side-by-side feature matrix |
| `/experiments` | Guided step-by-step learning exercises |
| `/tools` | Agent Login, DCR, and CIMD (no login required for agent) |

---

## Usage Guide — Learning the Differences

### Step 1: Login with Generic OIDC

1. Open http://localhost:5174
2. Click **Generic OIDC**
3. Authenticate through Duo
4. On the Dashboard, explore each tab:
   - **Token Inspector** — Look at the `aud` claim in the access token. It'll be the client ID.
   - **Claims** — Standard OIDC claims only (sub, iss, aud, exp, iat, name, email).
   - **Refresh** — Hit refresh, see the new token with updated `iat`/`exp`.
   - **UserInfo / Introspect** — Both work, returns standard profile data.
   - **Notice:** No Scopes, Agent, DCR, or Client Creds tabs — those features don't exist in this mode.

### Step 2: Logout, login with OAuth 2.1

1. Click **Logout** → back to home
2. Click **OAuth 2.1 / OIDC SSO**
3. Authenticate again, then check the same tabs:
   - **Token Inspector** — `aud` is now `http://localhost:3001` (your resource URL), not just a client ID. The token is scoped to your *API*.
   - **Claims** — Check for a `scope` claim with custom scopes (`read:reports`, etc.) based on the user's group membership.
   - **Scopes tab** — Shows which custom scopes were granted. Test buttons hit protected endpoints — some return 403 if the user's group lacks that scope.
   - **Agent Login tab** — Authenticate as a machine (no human). Compare the token to a user token.
   - **DCR tab** — Register a new OAuth client dynamically.
   - **Client Creds tab** — Get a machine token directly.

### Step 3: Tools page (no login needed)

Visit `/tools` directly from the home page for:
- **Agent Login** — Get a machine token using client credentials (no user flow)
- **DCR** — Register a new public client dynamically
- **CIMD** — Login with a client whose metadata lives at a URL

### Key Differences to Observe

| What to look at | Generic OIDC | OAuth 2.1 |
|----------------|-------------|-----------|
| `aud` in access token | Client ID | Your resource URL |
| `scope` in access token | `openid profile email` | Custom scopes per group |
| Dashboard tabs available | 5 | 9 (adds Scopes, Agent, DCR, Client Creds) |
| 403 on protected endpoints | N/A | Depends on user's group |
| Machine tokens | Not possible | Client Creds / Agent Login |

---

## OAuth 2.1 Client Types

Duo OAuth 2.1 supports three client types. Understanding them is key:

### Confidential Clients (Manual)

Created in Duo Admin → Clients tab → "Confidential Client Registration"

| Property | Value |
|----------|-------|
| Has client_secret | Yes |
| Client Credentials grant | Yes |
| Authorization Code grant | Yes |
| Scopes | Configured per-client in Admin |
| Deletable | Yes |
| Use case | Backend apps, APIs, agents/services |

**This is what agents use.** A confidential client can authenticate itself without a user present (client_credentials grant). Scopes are set per-client — you control exactly what each agent can do.

### DCR Clients (Dynamic Client Registration)

Created by POST to `/register` endpoint. Requires a bearer token.

| Property | Value |
|----------|-------|
| Has client_secret | No (public) |
| Client Credentials grant | No |
| Authorization Code + PKCE | Yes |
| Scopes | Inherited from "Public Client Scopes" in Admin |
| Deletable | Yes |
| Use case | Developer portals, SaaS onboarding, ephemeral environments |

**Registration only needs:** `client_name` + `redirect_uris`. Duo ignores extra fields (grant_types, scope, etc.). Scopes come from the application-level "Public Client Scopes" setting.

### CIMD Clients (Client ID Metadata Documents)

Self-register by hosting a JSON metadata document at a public URL. The URL IS the client_id.

| Property | Value |
|----------|-------|
| Has client_secret | No (public) |
| Client Credentials grant | No |
| Authorization Code + PKCE | Yes |
| Scopes | Inherited from "Public Client Scopes" in Admin |
| Deletable | No (permanent once activated) |
| Use case | CLIs, native apps, distributed tools that can't call a registration endpoint |

**Metadata document format:**
```json
{
  "client_name": "My App",
  "client_id": "https://example.com/path/to/metadata.json",
  "redirect_uris": ["http://localhost:3001/auth/callback/oauth21"]
}
```

The `client_id` field MUST exactly match the URL where the document is hosted.

---

## CIMD Testing

Pre-configured metadata document for testing:

- **Gist:** https://gist.github.com/shhv/74a119e14f33a31cd69d99cf39be3bef
- **Raw URL (use as client_id):** https://gist.githubusercontent.com/shhv/74a119e14f33a31cd69d99cf39be3bef/raw/cimd-metadata.json

To test: go to `/tools` → CIMD tab → "Login with CIMD Client"

**Tip:** Use the pinned raw URL format (without commit hash) so the `client_id` stays stable across gist edits.

---

## Agent / Machine Login

Agents authenticate using the **Client Credentials** grant — no human in the loop.

**How it works:**
1. Create a confidential client in Duo Admin (Clients tab)
2. Assign only the scopes the agent needs (principle of least privilege)
3. Agent calls the token endpoint with its client_id + client_secret
4. Gets an access token with no user claims (no sub, name, email)

**What's in an agent token:**
```
✓ iss, aud, exp, iat, scope, client_id
✗ sub, name, email, preferred_username, amr (no human = no identity)
```

**Test it:** Go to `/tools` → Agent Login → leave fields empty (uses default client) or paste a specific client's credentials.

---

## Duo Admin Setup

### Integration 1: Generic OIDC Relying Party

1. Applications → Application Catalog → "Generic OIDC Relying Party" → Add
2. General tab:
   - Grant types: Authorization Code
   - PKCE: Allow
   - Sign-In Redirect URL: `http://localhost:3001/auth/callback/oidc`
   - Enable refresh tokens
3. Scopes tab: openid, profile, email + add `offline_access`
4. Save → note Client ID, Secret, all endpoint URLs from Metadata tab

### Integration 2: OAuth 2.1 / OIDC - SSO

1. Applications → Application Catalog → "OAuth 2.1 / OIDC - Single Sign-On" → Add
2. General tab:
   - Grant types: Authorization Code, Client Credentials
   - PKCE: Enable
   - Redirect URL: `http://localhost:3001/auth/callback/oauth21`
   - Resource URLs: `http://localhost:3001`
   - Enable refresh tokens
3. Scopes tab: openid, profile, email + custom scopes:
   - `read:reports` — "View reports"
   - `write:reports` — "Create/edit reports"
   - `admin:manage` — "Admin operations"
4. Access Policy tab:
   - "Viewers" group → `openid`, `profile`, `email`, `read:reports`
   - "Editors" group → `openid`, `profile`, `email`, `read:reports`, `write:reports`
   - "Admins" group → `openid`, `profile`, `email`, `read:reports`, `write:reports`, `admin:manage`
5. Clients tab:
   - Add confidential client → set allowed scopes to all of the above
   - Enable DCR (check "Enable clients to register themselves during the authentication flow")
   - Enable CIMD (check "Enable clients to self-register using CIMD")
   - Set Public Client Scopes to the scopes DCR/CIMD clients should inherit
6. Save → note Client ID, Secret, DCR URL, all endpoint URLs

---

## Architecture

```
Frontend (Vite, :5174) → Backend (Express, :3001) → Duo Cloud
```

The frontend proxies API calls through Vite's dev server proxy. The backend handles all OAuth flows, stores tokens in session, and exposes APIs for the frontend to inspect tokens, test scopes, etc.

---

## Learning Guide

The app includes a **Guided Experiments** page (`/experiments`) with step-by-step exercises covering:

1. **Compare the aud claim** — resource indicators (both modes)
2. **Observe scope differences by group** — group → scope policy (2.1)
3. **Get a machine token** — client credentials (2.1)
4. **Register a client dynamically** — DCR (2.1)
5. **Refresh token rotation** — watch tokens change (both modes)
6. **Token introspection vs JWT decode** — when to use which (both modes)
7. **Understand the amr claim** — authentication methods (both modes)
8. **ID Token vs Access Token** — different audiences (both modes)

### The Core Insight

**Generic OIDC** answers: *"Who is this user?"* (authentication)

**OAuth 2.1** answers: *"Who is this user AND what are they allowed to do?"* (authentication + authorization)

The token itself carries the authorization decision. Your API checks the `scope` claim — no need to call back to Duo on every request.

---

## OAuth 2.0 vs 2.1 — When to Use What

| Use Generic OIDC when... | Use OAuth 2.1 when... |
|---|---|
| You just need login/SSO | You need to control what users can do |
| All users get the same access | Different roles need different permissions |
| Your app handles authorization internally | You want the IdP to decide permissions |
| Simple app, no API to protect | You have APIs that multiple clients call |
| Quick to set up | Worth the setup for granular control |
| No machine-to-machine needs | Agents/services need API access |
