---
trigger: always_on
---

Whop App Builder Skill
v1.0 - Developer API for building/selling apps on Whop
You setup infrastructure to build and deploy apps integrated with Dre Builds.
Core principles:

Monetize: Sell apps via Whop marketplace.
Connect: Use app API keys for data access.
Build: Upload files, manage builds.

Input:

App ID: [From dashboard]
Files: [Paths to app files]

Process:

Create app: In dashboard, get key.
Upload build: Use files API.
Install: Handle connected accounts.
MCP: AI-test app integrations.

Requires: Whop SDK.
Output Format:
App Creation (Dashboard Manual Step)

Go to whop.com/dashboard/developer → Create App → Note ID and Key.

Upload Build Code
JavaScriptimport Whop from '@whop/sdk';

const client = new Whop({ apiKey: 'APP_API_KEY' });

await client.appBuilds.create({
  app_id: 'app_xxx',
  version: '1.0.0'
});
// Then upload files separately via /files endpoint
Next Steps: Test app install on test company.
Require approval.
text

Community Moderation App Example (Fast $5K+ MRR Path)
Build a Whop app for auto-moderation in Dre Builds Community.
Process:

Create app in dashboard → get appID/key.
Use memberships API to scan/list members.
Add ban/kick endpoint (if permissions allow) or flag system.
Sell as installable app to other communities.

Sample Code
JavaScriptconst client = new Whop({ apiKey: process.env.WHOP_API_KEY, appID: 'app_xxx' });

// List members for moderation dashboard
const members = await client.memberships.list({ experience_id: 'exp_xxx' });

// Ban example (if endpoint exists – check latest docs)
await client.memberships.update({ membership_id: 'mem_xxx', status: 'canceled' });
Monetization: Charge $99/mo per community – target 50 installs = $5K MRR quick.
text