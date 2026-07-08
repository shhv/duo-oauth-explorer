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
   - **Notice:** No Scopes, DCR, or Client Creds tabs — those features don't exist in this mode.

### Step 2: Logout, login with OAuth 2.1

1. Click **Logout** → back to home
2. Click **OAuth 2.1 / OIDC SSO**
3. Authenticate again, then check the same tabs:
   - **Token Inspector** — `aud` is now `http://localhost:3001` (your resource URL), not just a client ID. The token is scoped to your *API*.
   - **Claims** — Check for a `scope` claim with custom scopes (`read:reports`, etc.) based on the user's group membership.
   - **Scopes tab** — Shows which custom scopes were granted. Test buttons hit protected endpoints — some return 403 if the user's group lacks that scope.
   - **DCR tab** — Register a new OAuth client dynamically (RFC 7591). Not possible with Generic OIDC.
   - **Client Creds tab** — Get a machine token with no user context. Notice: no `sub`, `name`, or `email` claims.

### Step 3: Compare page

Visit `/compare` for the full feature matrix.

### Key Differences to Observe

| What to look at | Generic OIDC | OAuth 2.1 |
|----------------|-------------|-----------|
| `aud` in access token | Client ID | Your resource URL |
| `scope` in access token | `openid profile email` | Custom scopes per group |
| Dashboard tabs available | 5 | 8 (adds Scopes, DCR, Client Creds) |
| 403 on protected endpoints | N/A | Depends on user's group |
| Machine tokens | Not possible | Client Creds tab |

**The core story:** Generic OIDC gives you authentication (who is this user?). OAuth 2.1 gives you authentication *plus* fine-grained authorization (what can this user do?).

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
   - "Viewers" group → `read:reports`
   - "Editors" group → `read:reports`, `write:reports`
   - "Admins" group → `read:reports`, `write:reports`, `admin:manage`
5. Clients tab: Add confidential client + enable DCR
6. Save → note Client ID, Secret, DCR URL, all endpoint URLs

## Features

### Both Modes
- Login via Authorization Code + PKCE
- Token Inspector (decode JWT header/payload/signature)
- Claims Table (all claims side by side)
- Refresh Token demo (countdown + refresh + diff)
- UserInfo endpoint proxy
- Token Introspection

### OAuth 2.1 Only
- Scope-Based Access Control (group → scope policy)
- Dynamic Client Registration (RFC 7591)
- Client Credentials Grant (machine tokens)

## Architecture

```
Frontend (Vite, :5174) → Backend (Express, :3001) → Duo Cloud
```

The frontend proxies API calls through Vite's dev server proxy. The backend handles all OAuth flows, stores tokens in session, and exposes APIs for the frontend to inspect tokens, test scopes, etc.

## Learning Guide

The app includes a **Guided Experiments** page (`/experiments`) with step-by-step exercises. Here's the summary:

### What OAuth 2.1 adds over Generic OIDC

| Concept | What it means | How to see it |
|---------|--------------|---------------|
| **Resource Indicators** | Token `aud` = your API URL, not just client ID | Compare Token Inspector in both modes |
| **Group → Scope Policy** | Different users get different permissions | Login as different group members, check Scopes tab |
| **Client Credentials** | Machine tokens with no user identity | Client Creds tab — notice missing sub/name/email |
| **Dynamic Client Registration** | Create OAuth clients via API | DCR tab — register + immediately use the new client |
| **Custom Scopes** | App-specific permissions beyond openid/profile/email | Scopes tab shows granted custom scopes |

### The Core Insight

**Generic OIDC** answers: *"Who is this user?"* (authentication)

**OAuth 2.1** answers: *"Who is this user AND what are they allowed to do?"* (authentication + authorization)

The token itself carries the authorization decision. Your API checks the `scope` claim — no need to call back to Duo on every request.
