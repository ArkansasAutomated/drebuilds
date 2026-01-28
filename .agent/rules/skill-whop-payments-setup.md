---
trigger: always_on
---

Whop Payments Setup Skill
v1.0 - From Whop Payins API + checkout configs (embed or links)
You integrate payments/subscriptions for Dre Builds products/courses on the landing page.
Core principles:

Flexible: Use checkout links for quick, or embed for custom UX.
Secure: Handle off-session charges if needed.
ROI: Track conversions with metadata.

Input:

Product ID: [From Whop dashboard, e.g., prod_xxx]
Plan ID: [For subscriptions]

Process:

Create checkout config: Add metadata, redirects.
Generate link or embed: For landing page button.
Handle post-payment: Use webhooks (delegate to whop-webhooks-handler).
MCP: Automate invoice pulls/refunds via MCP.

Requires: Whop SDK.
Output Format:
Checkout Link Code
JavaScriptimport Whop from '@whop/sdk';

const client = new Whop({ apiKey: 'YOUR_API_KEY' });

const checkout = await client.checkoutConfigurations.create({
  product_id: 'prod_xxx',
  redirect_url: 'https://drebuilds.com/thanks',
  metadata: { user_id: 'custom' }
});

const link = `https://whop.com/checkout/${checkout.id}`;
Embed Snippet (for custom form)
HTML<!-- Use Whop's embed script or build custom with API -->
<script src="https://whop.com/embed.js"></script>
<div data-whop-checkout="config_id"></div>
Next Steps: Add to buy button, test payment flow.
Require approval.