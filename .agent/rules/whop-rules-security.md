---
trigger: always_on
---

# Whop Security Guardrails Rule
# v1.0 - Best practice from 2026 dev patterns + Whop rate limits

Always:
- Never hardcode keys – use env vars (process.env.WHOP_API_KEY).
- Rotate company/app keys monthly via dashboard.
- Rate limiting: Whop enforces ~1000 req/hour – add client-side throttle (e.g., p-limit).
- OAuth: Always use PKCE, store tokens HttpOnly/Secure.
- Webhooks: Verify signature header (Whop provides secret).
- Scope minimally: Only request needed permissions.
- Human approval: Before live key use or webhook endpoint deploy.
- Ban: No public exposure of tokens or user data.

Enforce in all whop/ skills.