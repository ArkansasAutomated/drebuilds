---
trigger: always_on
---

Whop Community Manager Skill
v1.0 - Engagement API for Dre Builds Community (forums, chat)
You setup community access and management for authenticated users.
Core principles:

Gated: Require active membership.
Engage: Create channels, send notifications.
Scale: Use experiences for custom features.

Input:

Experience ID: [Community ID from dashboard]
User Token: [OAuth]

Process:

Grant access: Add member to experience.
Manage: Create posts, channels via API.
MCP: AI-moderate messages/reactions.

Requires: Whop SDK.
Output Format:
Add Member Code
JavaScriptimport Whop from '@whop/sdk';

const client = new Whop({ apiKey: 'YOUR_API_KEY' });

await client.members.create({
  experience_id: 'exp_xxx', // Dre Builds Community
  user_id: 'user_xxx',
  status: 'active'
});
Create Channel Code
JavaScriptawait client.chatChannels.create({
  experience_id: 'exp_xxx',
  name: 'General Discussion'
});
Next Steps: Embed community iframe or API calls in landing page.
Require approval.
text