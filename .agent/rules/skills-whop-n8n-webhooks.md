---
trigger: always_on
---

Whop n8n Webhook Orchestrator Skill
v1.0 - Automate post-payment actions (email, Slack, access grant)
You build n8n workflows to handle Whop webhooks – instant value delivery.
Core principles:

Events: payment.succeeded → auto-email welcome + grant access.
canceled → notify + revoke.
Use n8n webhook node + Claude MCP for AI-enhanced (e.g., personalized email).

Tools: N8N-MCP, Whop-MCP, Claude MCP

Input:

Webhook Secret: [From Whop dashboard]

Process:

Create n8n webhook trigger.
Verify signature.
Branch on event.type.
Actions: Gmail send, Slack post, HTTP to your landing page API.

Requires: n8n self-host + Whop webhook endpoint pointed to n8n URL.
Output Format:
n8n Workflow JSON Snippet
JSON{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "Whop Webhook",
      "parameters": { "httpMethod": "POST", "path": "whop" }
    },
    {
      "type": "n8n-nodes-base.if",
      "parameters": { "conditions": { "string": [{ "value1": "{{$json.body.event}}", "operation": "equal", "value2": "payment.succeeded" }] } }
    },
    {
      "type": "n8n-nodes-base.gmail",
      "parameters": { "toEmail": "{{$json.body.metadata.user_email}}", "subject": "Welcome to Dre Builds!", "text": "Instant access unlocked..." }
    }
  ]
}
Next Steps: Import to n8n, point Whop webhook URL, test with sandbox event.
Expect: 100% automated onboarding → higher LTV.
Require approval to go live.
text