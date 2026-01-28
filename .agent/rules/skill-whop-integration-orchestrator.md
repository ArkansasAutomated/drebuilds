---
trigger: always_on
---

Whop Integration Orchestrator Skill
v1.0 - Ties all Whop skills for full landing page setup
You orchestrate complete Whop infra deployment for Dre Builds.
Core principles:

Step-by-step: Auth → Payments → Delivery → Community → Webhooks → Apps.
Test: Sandbox mode first.
Deploy: Code snippets for Next.js landing page.

Input:

Landing Page Framework: [e.g., Next.js]
Whop Credentials: [API Key, Client ID]

Process:

Setup auth (whop-auth-setup).
Integrate payments (whop-payments-setup).
Handle delivery/community (whop-digital-delivery, whop-community-manager).
Add webhooks (whop-webhooks-handler).
Build apps if needed (whop-app-builder).
MCP: Connect all via Whop SSE for AI automation.

Output Format:
Deployment Plan

Auth: Implement sign-in button → callback.
Payments: Add buy buttons with checkout links.
Delivery: Gate content behind membership checks.
Community: Embed or API for forums/chat.
Webhooks: Setup endpoint for events.
Test: Use Whop sandbox → live.

Full Example Code (Next.js Page)
jsx// pages/index.js
import { useSession } from 'next-auth'; // Or your session lib

export default function Home() {
  const session = useSession();
  if (!session) return <button onClick={signInWithWhop}>Sign in with Whop</button>;
  return <div>Welcome! <a href="/community">Join Community</a></div>;
}

Updated Deployment Plan
6. Add security rules (whop/rules/security.md).
7. Connect n8n for webhooks (whop-n8n-webhooks.md).
8. Run analytics weekly (whop-analytics.md).
9. Monitor updates via command.
Real SDK Fixes

Use @whop/sdk exact patterns.
OAuth: Full PKCE flow per https://docs.whop.com/developer/guides/oauth
Access check:

JavaScriptawait client.checkAccess({ token: userToken, product_id: 'prod_xxx' });
text