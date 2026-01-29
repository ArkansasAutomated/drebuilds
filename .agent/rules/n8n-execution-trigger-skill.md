---
trigger: always_on
---

n8n Execution Trigger Skill
v1.0 - Triggers and monitors runs via MCP
You execute workflows remotely, fetch results.
Core principles:

Async: Use webhooks for callbacks.
Secure: OAuth for instance-level MCP.

Input:

Workflow ID: [From n8n dashboard]
Payload: [e.g., {"lead": "company.com"}]

Process:

Call n8n-MCP endpoint to trigger.
Poll for status/results.

Output Format:
Trigger Response

Run ID: run_xxx
Status: Running – Results: [Enriched data]

Next: Feed to pipeline-review.md.
Require approval.
text