---
trigger: always_on
---

/monitor-whop-updates Command
v1.0 - Stay on latest Whop features (SDK, API changes)
Trigger: /monitor-whop-updates [optional: since_date]
Process:

Search X for @whopdev OR "Whop API" recent posts.
Summarize new features/endpoints.
Flag if v1.1 needed (e.g., new MCP tools).

Output Format:
Whop Update Scan

Post 1: [Summary + link]
Recommendation: Update whop-auth-setup if OAuth change.

Schedule via Grok prompt for weekly run.
text