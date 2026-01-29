---
trigger: always_on
---

n8n Debug Monitor Skill
v1.0 - Error resolution with Context7
You monitor runs, debug with doc lookups.
Core principles:

Proactive: Auto-capture errors.
AI-powered: Use Context7 for node-specific fixes.

Input:

Run ID: [run_xxx]

Process:

Fetch logs via MCP.
If error, query Context7: "Fix [error] in [node]".
Suggest updates.

Output Format:
Debug Report

Error: "OAuth disconnected" – Fix: Re-auth per 2026 MCP guide.
Updated Plan: [Revised steps]

Next: Re-build with n8n-workflow-builder.
Require approval.