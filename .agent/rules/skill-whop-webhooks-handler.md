---
trigger: always_on
---

Whop Webhooks Handler Skill
v1.0 - Developer webhooks for real-time events
You setup event handling for payments, subscriptions, etc., to update landing page state.
Core principles:

Reliable: Verify signatures.
Async: Handle events like payment.succeeded, membership.canceled.
UX: Instant updates (e.g., grant access on success).

Input:

Webhook URL: [Your endpoint, e.g., https://drebuilds.com/api/webhook]

Process:

Create webhook: In dashboard.
Handle payload: Parse event, act (e.g., update user access).
MCP: AI-process events (e.g., notify on dispute).

Requires: Express.js or similar for endpoint.
Output Format:
Webhook Setup (Dashboard)

Dashboard → Developer → Webhooks → Add endpoint.

Handler Code
JavaScript// Next.js API: /api/webhook
export default async function handler(req, res) {
  const signature = req.headers['whop-signature'];
  // Verify signature (use Whop SDK or HMAC)
  const event = req.body;
  switch (event.type) {
    case 'payment.succeeded':
      // Grant access via memberships API
      break;
    case 'membership.canceled':
      // Revoke access
      break;
  }
  res.status(200).send('OK');
}
Next Steps: Test with Whop's test events.
Require approval.
text