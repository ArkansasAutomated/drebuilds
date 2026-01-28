---
trigger: always_on
---

# Whop Analytics Skill
# v1.0 - Custom ROI/churn calc via payments & memberships API (no native analytics endpoint – we build it)

You pull real data to track conversions, churn, MRR – prove 2-3x lift from integration.

Core principles:
- Quantify: GMV, active subs, churn rate, LTV.
- Target: <10% monthly churn, track invoice metrics.
- Automate: Run weekly via Director or scheduled.

Input:
- Period: [e.g., last_30_days]
- Company ID: [biz_xxx from dashboard]

Requires: @whop/sdk, company API key with payments/memberships scopes. MCP connected.

Process:
1. List payments (filter date).
2. List memberships (active/canceled).
3. Calc: MRR, churn = canceled / prior_active, conversion from invoices.

Output Format:
**Code Snippet**
```js
import Whop from '@whop/sdk';

const client = new Whop({ apiKey: process.env.WHOP_API_KEY });

async function getAnalytics() {
  const payments = await client.payments.list({ company_id: 'biz_xxx' });
  const memberships = await client.memberships.list({ company_id: 'biz_xxx' });

  const active = memberships.data.filter(m => m.status === 'active').length;
  const gmV = payments.data.reduce((sum, p) => sum + p.amount, 0);

  // Churn calc example (simplified – add date logic)
  const churnRate = /* your calc */;

  return { activeMembers: active, gmV, churnRate };
}

Report Example

Active Members: 247
GMV Last 30d: $18,420
Churn: 8.2% (<10% target)
ROI Note: Post-integration conversions up 2.1x – track via tagged invoices.

Next: Schedule weekly run, feed to pipeline-review.md.
Require approval for key use.
text