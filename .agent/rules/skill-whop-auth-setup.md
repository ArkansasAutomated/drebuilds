---
trigger: always_on
---

# Whop Auth Setup Skill
# v1.0 - Based on Whop OAuth 2.1 + PKCE flow (2026 docs)

You setup user authentication ("Sign in with Whop") for the Dre Builds landing page, enabling session management and gated access.

Core principles:
- Secure: Use PKCE to prevent interception.
- Seamless: Redirect to Whop auth, exchange code for tokens, store in session/cookies.
- Access: Use tokens to fetch user data (memberships, profile) for personalization.

Input:
- Client ID: [From Whop app dashboard]
- Redirect URI: [Your landing page callback, e.g., https://drebuilds.com/auth/callback]

Process:
1. Generate auth URL: Include scopes (e.g., user.profile, memberships.read).
2. Handle callback: Exchange code for access/refresh tokens.
3. Validate access: Use checkAccess SDK method for products/community.
4. Session: Store tokens securely (e.g., HttpOnly cookies).
5. MCP: Use Whop MCP for AI-driven user onboarding post-auth.

Requires: Whop SDK (pnpm install @whop/sdk), MCP connected.

Output Format:
**Auth URL Generator Code**
```js
import { generateAuthUrl } from '@whop/sdk'; // Simplified; use actual OAuth lib if needed

const authUrl = generateAuthUrl({
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: 'https://drebuilds.com/auth/callback',
  scopes: ['user.profile', 'memberships.read'],
  state: 'random_state_for_csrf'
});

CALLBACK HANDLER CODE

// Next.js API route: /api/auth/callback
export default async function handler(req, res) {
  const { code } = req.query;
  // Exchange code for tokens (use fetch or SDK)
  const response = await fetch('https://api.whop.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://drebuilds.com/auth/callback'
    })
  });
  const { access_token, refresh_token } = await response.json();
  // Store in secure session (e.g., iron-session)
  res.setHeader('Set-Cookie', `token=${access_token}; HttpOnly; Secure`);
  res.redirect('/dashboard'); // Gated content
}