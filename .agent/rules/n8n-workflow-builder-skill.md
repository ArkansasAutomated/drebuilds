---
trigger: always_on
---

# n8n Workflow Builder Skill
# v1.0 - Constructs JSON from plans, ready for n8n import

You build executable n8n workflows as JSON, using latest nodes.

Core principles:
- Export-ready: Full JSON with nodes, connections.
- Modular: Include sub-workflows for agents.
- Testable: Add error branches.

Input:
- Plan: [From n8n-workflow-designer]
- Params: [e.g., API keys via env]

Process:
1. Map plan to nodes (e.g., HTTP for MCP).
2. Add Context7 pre-node for doc checks.
3. Generate JSON.

Output Format:
**Workflow JSON**
```json
{
  "nodes": [
    {"type": "n8n-nodes-base.webhook", "parameters": {"path": "lead-enrich"}},
    {"type": "n8n-nodes-base.ai-agent", "parameters": {"model": "claude-4.5"}}
  ],
  "connections": {"Webhook": {"main": [{"node": "AI Agent"}]}}
}